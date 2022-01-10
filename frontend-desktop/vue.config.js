const path = require('path');
module.exports = {
	outputDir: path.resolve(__dirname, '../prod/desktop'),

	devServer: {
		proxy: 'http://localhost:5001',
	},

	configureWebpack: {
		devtool: 'cheap-source-map',
	},

	transpileDependencies: ['vuetify'],
};
