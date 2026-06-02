/**
 * Thrown by {@link fetchJsonVersion} when the endpoint responds with a non-2xx status.
 */
export class VersionCheckError extends Error {
	/**
	 * The failed response.
	 */
	readonly response: Response;

	constructor(response: Response) {
		super(`Version check failed with HTTP ${response.status}`);
		this.name = "VersionCheckError";
		this.response = response;
	}
}
