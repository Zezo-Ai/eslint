/**
 * @fileoverview Script to update the README with team and sponsors.
 * Note that this requires eslint/website to be available in the same
 * directory as the eslint repo.
 *
 *   node tools/update-readme.js
 *
 * @author Nicholas C. Zakas
 */
"use strict";

//-----------------------------------------------------------------------------
// Requirements
//-----------------------------------------------------------------------------

const fs = require("node:fs");
const { stripIndents } = require("common-tags");
const ejs = require("ejs");
const got = require("got");

//-----------------------------------------------------------------------------
// Data
//-----------------------------------------------------------------------------

const SPONSORS_URL =
	"https://raw.githubusercontent.com/eslint/eslint.org/main/includes/sponsors.md";
const TEAM_URL =
	"https://raw.githubusercontent.com/eslint/eslint.org/main/src/_data/team.json";
const README_FILE_PATH = "./README.md";

const readme = fs.readFileSync(README_FILE_PATH, "utf8");

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

/**
 * Fetches the latest sponsors from the website.
 * @returns {Promise<string>} Prerendered sponsors markdown.
 */
async function fetchSponsorsMarkdown() {
	return got(SPONSORS_URL).text();
}

/**
 * Fetches the latest team data from the website.
 * @returns {Object} The sponsors data object.
 */
async function fetchTeamData() {
	return got(TEAM_URL).json();
}

/**
 * Formats an array of team members for inclusion in the readme.
 * @param {Array} members The array of members to format.
 * @returns {string} The HTML for the members list.
 */
function formatTeamMembers(members) {
	return stripIndents`
        <table><tbody><tr>${members
			.map(
				(member, index) => `<td align="center" valign="top" width="11%">
            <a href="https://github.com/${member.username}">
                <img src="https://github.com/${
					member.username
				}.png?s=75" width="75" height="75" alt="${member.name.trim()}'s Avatar"><br />
                ${member.name.trim()}
            </a>
            </td>${(index + 1) % 9 === 0 ? "</tr><tr>" : ""}`,
			)
			.join("")}</tr></tbody></table>`;
}

//-----------------------------------------------------------------------------
// Main
//-----------------------------------------------------------------------------

const HTML_TEMPLATE = stripIndents`

    <!--teamstart-->

    ### Technical Steering Committee (TSC)

    The people who manage releases, review feature requests, and meet regularly to ensure ESLint is properly maintained.

    <%- formatTeamMembers(team.tsc) %>

    <% if (team.reviewers.length > 0) { %>
    ### Reviewers

    The people who review and implement new features.

    <%- formatTeamMembers(team.reviewers) %>

    <% } %>

    <% if (team.committers.length > 0) { %>
    ### Committers

    The people who review and fix bugs and help triage issues.

    <%- formatTeamMembers(team.committers) %>

    <% } %>

    <% if (team.website.length > 0) { %>
    ### Website Team

    Team members who focus specifically on eslint.org

    <%- formatTeamMembers(team.website) %>

    <% } %>
    <!--teamend-->
`;

(async () => {
	const [allSponsors, team] = await Promise.all([
		fetchSponsorsMarkdown(),
		fetchTeamData(),
	]);

	// replace all of the section
	let newReadme = readme.replace(
		/<!--teamstart-->[\w\W]*?<!--teamend-->/u,
		ejs.render(HTML_TEMPLATE, {
			team,
			formatTeamMembers,
		}),
	);

	newReadme = newReadme.replace(
		/<!--sponsorsstart-->[\w\W]*?<!--sponsorsend-->/u,
		`<!--sponsorsstart-->\n\n${allSponsors}\n\n<!--sponsorsend-->`,
	);

	// replace multiple consecutive blank lines with just one blank line
	newReadme = newReadme.replace(/(?<=^|\n)\n{2,}/gu, "\n");

	// output to the file
	fs.writeFileSync(README_FILE_PATH, newReadme, "utf8");
})();
