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

    private removeDuplicateTransaction() {

    }

    private createMissingTransaction() {

    }

    validateStatements = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        const transactions: Transaction[] = request.body["movements"];
        const inspectionPoints: InspectionPoint[] = request.body["balances"];

        console.log(transactions, inspectionPoints) // TODO remove

        // Promise really necessary given context? 
        // Maybe not, but useful as a demonstration in the case in a real context we have to make an async call somewhere for this op
        try {
            let resList: Object[] = await new Promise((resolve, reject) => {
                let reasons = null
                // Sort the lists by date if necessary?
                transactions.sort((a, b) => { return -(new Date(b.date).getTime() - new Date(a.date).getTime()) })
                inspectionPoints.sort((a, b) => { return -(new Date(b.date).getTime() - new Date(a.date).getTime()) })

                console.log(transactions, inspectionPoints) // TODO remove

                inspectionPoints.forEach((inspectionPoint) => {
                    console.log(inspectionPoint.balance)
                })

                resolve(reasons)
            })
            if (resList == null) {
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


