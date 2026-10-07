import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'This tool converts a cron schedule into a systemd timer. Paste a five-field cron expression such as 0 9 * * 1-5, or a shortcut like @daily, and it writes the matching OnCalendar= line plus a ready-to-use .timer file and .service file you can copy or download.',
    'Moving a crontab entry to systemd gives you logging through journalctl, a clear record of the last and next run, and the option to catch up on runs that were missed while the machine was switched off. The conversion runs in your browser, and it also shows the schedule in plain English so you can check it means what you think.',
  ],
  steps: [
    'Type or paste your cron schedule, for example */15 * * * * or @hourly.',
    'Enter a unit name (letters, digits, dashes) and the command the job should run.',
    'Choose whether the timer should be Persistent, so a run missed during downtime happens at the next boot.',
    'Download the .timer and .service files and place them in /etc/systemd/system/.',
    'Run systemctl daemon-reload, then systemctl enable --now <name>.timer to start the schedule.',
    "Optionally check the schedule on your server with systemd-analyze calendar '<OnCalendar value>'.",
  ],
  faq: [
    {
      q: 'How do I convert a cron job to a systemd timer?',
      a: 'You need two units: a .service file that runs the command and a .timer file whose OnCalendar= line describes when. This tool builds both from your cron line. Install them in /etc/systemd/system/, reload systemd and enable the timer instead of keeping the crontab entry.',
    },
    {
      q: 'What is the OnCalendar equivalent of a cron expression?',
      a: 'OnCalendar uses the form "weekday year-month-day hour:minute:second". For example, cron */15 * * * * becomes *-*-* *:00/15:00 and 0 9 * * 1-5 becomes Mon..Fri *-*-* 09:00:00. Shortcuts such as @daily and @hourly map to systemd\'s daily and hourly.',
    },
    {
      q: 'Why does my schedule produce two OnCalendar lines?',
      a: 'When a cron line restricts both the day of the month and the weekday, cron runs the job if either one matches. A single OnCalendar expression requires both to match, so the tool writes one line for the weekdays and one for the days of the month. A timer may list several OnCalendar= lines.',
    },
    {
      q: 'What does Persistent=true do?',
      a: 'With Persistent=true, systemd remembers when the timer last fired. If the machine was off at a scheduled time, the job runs once soon after the next boot. Cron has no built-in equivalent, which is a common reason to switch.',
    },
    {
      q: 'Can I convert @reboot to a systemd timer?',
      a: '@reboot is not a calendar time, so there is no OnCalendar value for it. Use OnBootSec= in the [Timer] section instead, for example OnBootSec=1min, or simply enable the service itself with WantedBy=multi-user.target.',
    },
    {
      q: 'Why is my command wrapped in /bin/sh -c?',
      a: 'ExecStart= does not run your command through a shell, so pipes, redirects, && and variables would not work. If the command contains shell syntax, the tool wraps it in /bin/sh -c so it behaves the way it did in your crontab.',
    },
  ],
}

export default content
