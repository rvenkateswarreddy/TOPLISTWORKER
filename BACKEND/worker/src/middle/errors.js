export function errorHandler(error) {
	console.error('Error:', error);

	const status = error.status || 500;
	const message = error.message || 'An unexpected error occurred';

	return new Response(
		JSON.stringify({
			error: message,
			stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
		}),
		{
			status,
			headers: {
				'Content-Type': 'application/json',
			},
		}
	);
}
