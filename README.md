# TransactionSyncExpressTS

NodeJS Express concept application for synchronising bank transactions with bank statements.
Coded to the best of my ability using TypeScript norms with a unit-test first approach (TDD) and error handling.

## Installation

Install dependencies
```sh
npm install
```

Then run
```sh
npm run dev
```
Uses nodemon for refresh after changes.

To run unit tests
```sh
npm t
```

Handles POST requests to `/movements/validation`
The POST API expects data to resemble the following; anything else will get a 500 response
```javascript
{
“movements”: [{ id, date, label, amount }],
“balances”: [{ date, balance }]
}
```
#### Points of improvement

- Correctly using Dates once received; currenly I create new Dates every time I want to compare Dates
- Move code into seperate private functions for the algorithm; I decided against it so I could explain in one place*
- Improve unit test and debugging workflow
- Add coverage and other quality measures such as Sonar

Any other feedback is more than welcome.
