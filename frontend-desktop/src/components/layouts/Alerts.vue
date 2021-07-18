<template>
	<v-snackbars :objects.sync="objects"></v-snackbars>
</template>

<script>
import VSnackbars from './CustomSnackbar.vue';
import { mapGetters } from 'vuex';
export default {
	name: 'app-notification-alert',
	components: {
		'v-snackbars': VSnackbars,
	},
	data() {
		return {
			objects: [],
		};
	},
	watch: {
		notifications: function(newVal) {
			if (Array.isArray(newVal) && newVal.length > 0) {
				const { message, type } = newVal.pop();
				this.objects.push({
					message,
					type,
				});
			}
		},
	},
	computed: {
		...mapGetters({
			notifications: 'notifications',
		}),
	},
};
</script>

<style></style>
