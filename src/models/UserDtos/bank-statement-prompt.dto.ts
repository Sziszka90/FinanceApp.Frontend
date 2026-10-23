export interface BankStatementPromptDto {
  id: string;
  name: string;
  instructions: string;
  isSelected: boolean;
}

export interface SaveBankStatementPromptDto {
  name: string;
  instructions: string;
}
