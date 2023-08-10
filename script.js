import inquirer from 'inquirer';
import csv from 'csvtojson';
// eslint-disable-next-line @typescript-eslint/no-var-requires
import j2m from 'jira2md';
import { importIssues } from './importIssues.js';
import { getTeamMemberName } from './utils/replaceTeam.js';

/**
 * Import issues from a Jira CSV export.
 *
 * @param filePath Path to CSV file
 * @param orgSlug Jira site name
 * @param customUrl Non-cloud Jira instance base URL
 */
export class YouTrackCsvImporter {
  constructor(filePath) {
    this.filePath = filePath;
  }

  get name() {
    return 'Youtrack (CSV)';
  }

  get defaultTeamName() {
    return 'Youtrack';
  }

  import = async () => {
    const data = await csv().fromFile(this.filePath);

    const importData = {
      issues: [],
      labels: {},
      descriptions: {},
      users: {},
      statuses: {},
    };

    const statuses = Array.from(new Set(data.map(row => row.State)));
    const assignees = Array.from(new Set(data.map(row => getTeamMemberName(row.Assignee))));

    for (const user of assignees) {
      importData.users[user] = {
        name: user,
      };
    }

    for (const status of statuses) {
      if (importData.statuses?.[status]) {
        importData.statuses[status] = {
          name: status,
        };
      }
    }

    for (const row of data) {
      const url = undefined;
      const mdDesc = row.Description
        ? j2m.to_markdown(row.Description)
        : undefined;
      const description = mdDesc;
      const priority = mapPriority(row.Priority);
      const type = `${row['Type']}`;
      const tags = row.Tags ? row.Tags.split(',') : [];
      const release =
        row.Release && row.Release.length > 0
          ? `Release: ${row.Release}`
          : undefined;
      const assigneeId =
        row.Assignee && row.Assignee.length > 0 ? getTeamMemberName(row.Assignee) : undefined;
      const status = row.Resolved ? 'Done' : row.State;

      const labels = type ? [type] : [];
      if (tags) {
        labels.push(...tags);
      }

      if (release) {
        labels.push(release);
      }

      importData.issues.push({
        title: row.Summary,
        description,
        status,
        priority,
        url,
        assigneeId,
        labels,
      });

      for (const lab of labels) {
        if (!importData.labels[lab]) {
          importData.labels[lab] = {
            name: lab,
          };
        }
      }
    }

    return importData;
  };

  // -- Private interface

  filePath;
}

const mapPriority = input => {
  const priorityMap = {
    Highest: 1,
    High: 2,
    Medium: 3,
    Low: 4,
    Lowest: 0,
  };
  return priorityMap[input] || 0;
};


const BASE_PATH = process.cwd();

const questions = [
  {
    basePath: BASE_PATH,
    type: 'filePath',
    name: 'youtrackFilePath',
    message: 'Select your exported CSV file of YouTrack issues',
  },
];

const youTrackCsvImport = async () => {
  const answers = await inquirer.prompt(questions);
  const ytImporter = new YouTrackCsvImporter(`${BASE_PATH}/${answers.youtrackFilePath}`);
  return ytImporter;
};

const prompt = async () => {
  try {
    const importAnswers = await inquirer.prompt([
      {
        type: 'input',
        name: 'linearApiKey',
        message: 'Input your Linear API key (https://linear.app/settings/api)',
      },
    ]);

    const importer = await youTrackCsvImport();

    if (importer) {
      await importIssues(importAnswers.linearApiKey, importer);
    }

  } catch (error) {
    console.error(error);
  }
};

prompt();
