import config from './config';

export const validateEmail = (email) => {
	const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return re.test(String(email).toLowerCase());
};

export const validatePassword = (password) => {
	return password.length >= 8;
};

export const validateDomain = (domain) => {
	const re = /^(?!:\/\/)(?=.{1,255}$)((.{1,63}\.){1,127}(?![0-9]*$)[a-z0-9-]+\.?)$/i;
	return re.test(domain);
};

export const validatePartnerName = (name) => {
	const re = /^[a-z0-9-]{3,30}$/;
	return re.test(name);
};

export const validateToplistType = (type) => {
	return config.toplistTypes.includes(type);
};

export const validateOutputFormat = (format) => {
	return config.outputFormats.includes(format);
};

export const validateLimit = (limit) => {
	const num = parseInt(limit, 10);
	return !isNaN(num) && num > 0 && num <= 50;
};

export const validateSettings = (settings) => {
	const errors = [];

	if (settings.layout && !['1', '2'].includes(settings.layout)) {
		errors.push('Layout must be either "1" or "2"');
	}

	if (settings.textColor && !/^#([0-9a-f]{3}){1,2}$/i.test(settings.textColor)) {
		errors.push('Invalid text color format');
	}

	if (settings.backgroundColor && !/^#([0-9a-f]{3}){1,2}$/i.test(settings.backgroundColor)) {
		errors.push('Invalid background color format');
	}

	return errors.length === 0 ? null : errors;
};

export const validateUserInput = (user) => {
	const errors = [];

	if (!validateEmail(user.email)) {
		errors.push('Invalid email format');
	}

	if (!validatePassword(user.password)) {
		errors.push('Password must be at least 8 characters');
	}

	if (!user.name || user.name.length < 2) {
		errors.push('Name must be at least 2 characters');
	}

	return errors.length === 0 ? null : errors;
};
