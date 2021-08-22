import * as express from 'express';
import Transaction from './transaction.interface';
import InspectionPoint from './inspectionPoint.interface';
import HttpException from '../../../exceptions/httpException';

class ValidationController {
    public path = '/movements/validation';
    public router = express.Router();

    constructor() {
        this.intializeRoutes();
    }

    public intializeRoutes() {
        this.router.post(this.path, this.validateStatements);
    }

    validateStatements = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        let transactions: Transaction[] = request.body["movements"];
        const inspectionPoints: InspectionPoint[] = request.body["balances"];
        // Probable point for code clarity: initialize date objects within these lists instead of doing it every time I need a check
        // Need feedback for this

        try {
            // Sort the lists to have the dates in order for analysis (if necessary)
            transactions.sort((a, b) => { return -(new Date(b.date).getTime() - new Date(a.date).getTime()) })
            inspectionPoints.sort((a, b) => { return -(new Date(b.date).getTime() - new Date(a.date).getTime()) })

            // Promise really necessary given context? 
            // Maybe not, but useful as a demonstration in the case in a real context we have to make an async call somewhere for this op
            let resList: Object[] = await new Promise((resolve, reject) => {
                let reasons: Object[] = []

                // OF NOTE: The following code sections could be placed as private functions as necessary.
                // I am prefering to keep them here as to clearly explain my code all in one place

                // Remove any duplicates that can be immediately recognized
                // I am basing my understanding of a 'duplicate' on the id alone. I am sure this might have to be more complicated... taking into account the other fields
                // In which case a comparison between transaction dates/values/labels will be required
                const onlyUnique = (value, index, self) => {
                    // (self.findIndex) : finds the first index where the value 'id' is that of the item we are evaluating in the filter 
                    // (index === self.find.index) : if the found index is not the same as our current filter object, it means it's a duplicate
                    let isUnique = index === self.findIndex((elem) => (
                        elem.id === value.id
                    ))
                    if (!isUnique) {
                        const reason = {
                            "problemType": "Duplicate Transaction",
                            "transactionDate": value.date,
                            "transactionAmount": value.amount,
                            "actionRequired": "None"
                        }
                        reasons.push(reason)
                    }
                    return isUnique
                }
                transactions = transactions.filter(onlyUnique)

                // We must also ignore any transaction prior to our first control point as it gives us no insight to the balance of the account
                // Here I'm removing if equal to the date as well for simplicity sake, this may provoke a problem?
                while (transactions.length > 0 &&
                    new Date(transactions[0].date).getTime() <= new Date(inspectionPoints[0].date).getTime()) {
                    transactions.shift()
                }
                // If all transactions take place before first period, send no problem
                if (!transactions.length) {
                    resolve(reasons)
                    return
                }
                
                // We need a baseline balance at start to know whether balances from following inspection points seem correct from the transactions that follow
                // We take as first baseline balance the date of the first inspection point before the first transaction that we can have a baseline for
                for (var inspectionStartIndex = 0;
                    inspectionStartIndex < inspectionPoints.length - 1 &&
                    new Date(inspectionPoints[inspectionStartIndex].date).getTime() < new Date(transactions[0].date).getTime();
                    inspectionStartIndex++);
                // in the case all transactions happen after the last inspection point, we suppose they are valid as we cannot know until next period
                if (new Date(inspectionPoints[inspectionStartIndex].date).getTime() < new Date(transactions[0].date).getTime()) {
                    resolve(reasons)
                    return
                }
                // we come back one index to be on the inspection point just before our first analysable transaction
                inspectionStartIndex--

                // We then analyse if we obtain the correct balance with the given transactions per period between inspection points
                let i = 0
                let currentBalance = inspectionPoints[inspectionStartIndex].balance
                while (inspectionStartIndex < inspectionPoints.length - 1) {
                    while (i < transactions.length &&
                        new Date(transactions[i].date).getTime() <= new Date(inspectionPoints[inspectionStartIndex + 1].date).getTime()) {
                        currentBalance += transactions[i].amount
                        i++;
                    }
                    // Upon completing analysis of transactions within a period, move to next period and set the balance to expected number for next period analysis
                    inspectionStartIndex++
                    // After adding transactions together for current period, check if there is a discrepancy
                    // If so, add to reason list
                    if (currentBalance != inspectionPoints[inspectionStartIndex].balance) {
                        const reason = {
                            "problemType": "Balance discrepency: likely missing transactions",
                            "periodStart": inspectionPoints[inspectionStartIndex - 1].date,
                            "periodEnd": inspectionPoints[inspectionStartIndex].date,
                            "amountStart": inspectionPoints[inspectionStartIndex - 1].balance,
                            "amountEndFound": currentBalance,
                            "amountEndExpected": inspectionPoints[inspectionStartIndex].balance,
                            "actionRequired": "Look for missing transactions"
                        }
                        reasons.push(reason)
                        currentBalance = inspectionPoints[inspectionStartIndex].balance
                    }
                }

                resolve(reasons)
            })
            if (resList.length == 0) {
                response.status(202).send({ message: "Accepted" });
            } else {
                response.status(418).send({ message: "I'm a teapot", "reasons": resList });
            }
        } catch (err) {
            // Maybe display error here
            next(new HttpException(500, "Couldn't validate bank statements. Bad input formatting?"))
        }

    }
}

export default ValidationController


