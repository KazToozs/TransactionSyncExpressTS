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

#### Explanation of process

Most of the code is commented if interested.

After initialising a basic Express application with json reading, routing and error handling middleware, the single POST route calls a function to validate the provided transactions and statements.

It starts by sorting the lists to ensure they are in date order before using a Promise to check their validity; I used this structure to replicate a possible scenario where validation is done externally, but as a whole may not be necessary in the given problem as is.

Within the Promise, I first search for duplicates, basing myself on the transaction IDs: if transactions have the same IDs, I keep the first occurence and add a notification to the list of sync problems called 'reasons'. Depending on expectations, this should be replaced with a deeper validation check based on dates/amounts/labels of the transactions.

I then ignore any transactions that happen before a first statement, as we do not know the baseline value they are affecting without a previous statement.

I then set the baseline balance to that given by the first statement. If all transactions happen after the last statement, they cannot be evaluated either as there is no balance expectation for the current period yet.

Starting with the first declared balance, the sum total of transactions is then compared to the amout expected at the end of the period for each period and if discrepencies occur, a notification is added to the list for that period.

The resulting list of discrepancies is then sent back via http response.

#### Points of improvement

- Correctly using Dates once received; currenly I create new Dates every time I want to compare Dates
- Move code into seperate private functions for the algorithm; I decided against it so I could explain in one place*
- Duplicate search on something other than just IDs
- Improve unit test and debugging workflow
- Add coverage and other quality measures such as Sonar

Any other feedback is more than welcome.
