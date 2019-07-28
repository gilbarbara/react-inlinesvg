/* tslint:disable:no-console */
import { promisify } from 'util';
import { exec } from 'child_process';
import chalk from 'chalk';
import * as yargs from 'yargs';

const run = promisify(exec);

module.exports = yargs
  .command({
    command: 'has-commits',
    describe: 'has new remote commits',
    handler: () => {
      run('git rev-parse --is-inside-work-tree')
        .then(() =>
          run('git remote -v update')
            .then(() =>
              Promise.all([
                run('git rev-parse @'),
                run('git rev-parse @{u}'),
                run('git merge-base @ @{u}'),
              ])
                .then(values => {
                  const [{ stdout: $local }, { stdout: $remote }, { stdout: $base }] = values;

                  if ($local === $remote) {
                    console.log(chalk.green('✔ Repo is up-to-date!'));
                  } else if ($local === $base) {
                    console.log(chalk.red('⊘ Error'), 'You need to pull, there are new commits.');
                    process.exit(1);
                  }
                })
                .catch(err => {
                  if (err.message.includes('no upstream configured ')) {
                    console.log(chalk.yellow('⚠ Warning'), 'No upstream. Is this a new branch?');
                    return;
                  }

                  console.log(chalk.yellow('⚠ Warning'), err.message);
                }),
            )
            .catch(err => {
              throw new Error(err);
            }),
        )
        .catch(() => {
          console.log('not under git');
        });
    },
  })
  .command({
    command: 'update',
    describe: 'run `npm update` if package.json has changed',
    handler: () =>
      run('git diff-tree -r --name-only --no-commit-id ORIG_HEAD HEAD')
        .then(({ stdout }) => {
          if (stdout.match('package.json')) {
            console.log(chalk.yellow('▼ Updating...'));
            // @ts-ignore
            exec('npm update').stdout.pipe(process.stdout);
          } else {
            console.log(chalk.green('✔ Nothing to update'));
          }
        })
        .catch(err => {
          throw new Error(err);
        }),
  })
  .demandCommand()
  .help()
  .wrap(72)
  .version(false)
  .strict().argv;
