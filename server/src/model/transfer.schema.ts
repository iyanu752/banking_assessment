import { Database } from "sqlite3"

enum TransactionType {
    'DEPOSIT',
    'WITHDRAWAL',
    'TRANSFER'
}

interface Transfer {
    id: string,
    accountNumber: number,
    description: string,
    createdAt: string,
    transactionType: {type: string, enum: TransactionType,}
    recentTransactions: 
}


export default Transfer;