export default function errorHandler(error, c) {
	console.error('Error:', error);

	const status = error.status || 500;
	const message = error.message || 'An unexpected error occurred';

	return c.json(
		{
			error: message,
			stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
		},
		status
	);
}
