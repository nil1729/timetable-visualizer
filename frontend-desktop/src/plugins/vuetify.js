import Vue from 'vue';
import Vuetify from 'vuetify/lib/framework';

Vue.use(Vuetify);

export default new Vuetify({
	theme: {
		dark: JSON.parse(localStorage.getItem('THEME_MODE') || '{}').theme === 'dark' ? true : false,
	},
});
