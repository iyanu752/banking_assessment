//dto validations
//amount must be a number
//description must be a string and is optional
//type must be an enum
import { IsString, IsNumber, IsEnum, IsNotEmpty } from "class-validator";

export enum TransactionType {
  DEPOSIT = "deposit",
  WITHDRAWAL = "withdrawal",
  TRANSFER = "transfer",
}

export class CreateTransactionDTO {
  @IsNotEmpty()
  @IsEnum(TransferType, {
    message: "Transfer type must be eposit, withdrawal ot transfer",
  })
  type: TransactionType;

  @IsString()
  description: string;

  @IsNumber()
  amount: number;
}
