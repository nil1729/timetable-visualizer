const createConfig = () => {
	return {
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
			'x-auth-token': localStorage.getItem('AUTH_TOKEN'),
		},
	};
};
export default createConfig;
