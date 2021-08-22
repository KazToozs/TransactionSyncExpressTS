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

                // We then analyse if we obtain the correct balance with the given transactions per period between inspection points
                // We start with a baseline balance from the first statement then continue over each period
                let i = 0
                let inspectionIndex = 0
                let currentBalance = inspectionPoints[inspectionIndex].balance
                while (inspectionIndex < inspectionPoints.length - 1) {
                    while (i < transactions.length &&
                        new Date(transactions[i].date).getTime() <= new Date(inspectionPoints[inspectionIndex + 1].date).getTime()) {
                        currentBalance += transactions[i].amount
                        i++;
                    }
                    // Upon completing analysis of transactions within a period, move to next period and set the balance to expected number for next period analysis
                    inspectionIndex++
                    // After adding transactions together for current period, check if there is a discrepancy
                    // If so, add to reason list
                    if (currentBalance != inspectionPoints[inspectionIndex].balance) {
                        const reason = {
                            "problemType": "Balance discrepency: likely missing transactions",
                            "periodStart": inspectionPoints[inspectionIndex - 1].date,
                            "periodEnd": inspectionPoints[inspectionIndex].date,
                            "amountStart": inspectionPoints[inspectionIndex - 1].balance,
                            "amountEndFound": currentBalance,
                            "amountEndExpected": inspectionPoints[inspectionIndex].balance,
                            "actionRequired": "Look for missing transactions"
                        }
                        reasons.push(reason)
                        currentBalance = inspectionPoints[inspectionIndex].balance
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


