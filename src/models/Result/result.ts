export interface Result<T = any> {
	isSuccess: boolean;
	message?: string;
	error?: string;
	data?: T;
}
