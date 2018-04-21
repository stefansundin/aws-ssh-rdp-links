This is my personal fork with some big changes that you will find hard to use:
- In the EC2 console, it converts the instance id and name tag to SSH links.
- It adds SSH links to RDS and Redshift.

Since you obviously cannot SSH to e.g. RDS, you need to use a terminal that can intercept the command and detect if the hostname is an RDS database or Redshift database.

I use [iTerm2 with my own patch](https://github.com/stefansundin/iTerm2) to run a bash script when I click SSH links.
