import Vue from 'vue';
import Vuex from 'vuex';
import createConfig from './helpers/api-auth';

Vue.use(Vuex);

export default new Vuex.Store({
	state: {},
	mutations: {},
	actions: {
		async sendRequest(context, { url, method, requestBody }) {
			try {
				let res = await fetch(`/api/v1/${url}`, {
					method: method,
					headers: createConfig(),
					body: requestBody && JSON.stringify(requestBody),
				});
				return await res.json();
			} catch (e) {
				console.log(e);
			}
		},
	},
	modules: {},
});
