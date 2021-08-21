
export module StatementSync {
    interface Transaction {
        id: number,
        date: Date,
        wording: string,
        amount: number
    }

    interface InspectionPoint {
        date: Date,
        balance: number
    }

    function removeDuplicateTransaction() {

    }

    function createMissingTransaction() {

    }

    export function syncBankStatements(transactionList: Transaction[], inspectionPointList: InspectionPoint[]) {
        console.log(transactionList, inspectionPointList)
        // By default, no sync issues, return null
        let reasons = null
        // Sort the lists by date if necessary?
        //transactionList.sort((a, b) => {return new Date(b.date) - new Date(a.date)})
        //inspectionPointList.sort((a, b) => {return new Date(b.date) - new Date(a.date)})

        inspectionPointList.forEach((inspectionPoint) => {
            console.log(inspectionPoint.balance)
        })
        return reasons
    }
}


