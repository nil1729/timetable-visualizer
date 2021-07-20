<template>
	<v-fab-transition>
		<v-tooltip left>
			<template v-slot:activator="{ on, attrs }">
				<v-btn
					@click="saveTimetable"
					v-show="!getSavingStatus"
					color="info"
					fixed
					bottom
					right
					fab
					v-bind="attrs"
					v-on="on"
				>
					<v-icon>mdi-content-save</v-icon>
				</v-btn>
			</template>
			<span>Save Timetable</span>
		</v-tooltip>
	</v-fab-transition>
</template>

<script>
import { mapGetters } from 'vuex';
export default {
	name: 'save-changes-button',
	computed: {
		...mapGetters(['getSavingStatus']),
	},
	methods: {
		async saveTimetable() {
			await this.$store.dispatch('saveTimetableSchedule');
		},
	},
};
</script>

<style></style>
