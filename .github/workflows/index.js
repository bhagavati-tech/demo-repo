const { GitHub, context } = require('@actions/github');
const ms = require('ms');

async function run() {
    const token = process.env.GITHUB_TOKEN;
    const client = new GitHub(token);

    const pendingLabel = 'Pending';
    const abandonedLabel = 'Abandoned';
    const waitTime = 5000; // 0.00138889 days
    const waitTimeString = ms(waitTime);

    const issues = await client.issues.listForRepo({
        owner: context.issue.owner,
        repo: context.issue.repo,
        state: 'open',
        labels: pendingLabel,
    });

    const now = new Date();
    const yesterday = new Date(now.getTime() - waitTime);

    for (const issue of issues.data) {
        if (new Date(issue.updated_at) < yesterday) {
            console.log(`Issue #${issue.number} is abandoned`);
            await client.issues.addLabels({
                owner: context.issue.owner,
                repo: context.issue.repo,
                issue_number: issue.number,
                labels: [abandonedLabel],
            });

            await client.issues.createComment({
                owner: context.issue.owner,
                repo: context.issue.repo,
                issue_number: issue.number,
                body: `It's been ${waitTimeString} since the last update on this issue. Please provide an update.`,
            });
        }
    }
}

run();