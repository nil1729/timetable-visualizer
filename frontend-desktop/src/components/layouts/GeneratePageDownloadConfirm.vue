<template>
	<v-dialog v-model="dialog" persistent max-width="800" width="fit-content">
		<v-card>
			<v-card-title class="text-body-1">
				PDF generation may take some time to complete
			</v-card-title>
			<v-card-text>
				<div class="text-body-1">
					Do you want to continue? (Only first 100 timetables will be printed)
				</div>
			</v-card-text>
			<v-card-actions>
				<v-spacer></v-spacer>
				<v-btn color="green darken-1" text @click="confirmQuery(false)"> No </v-btn>
				<v-btn color="green darken-1" text @click="confirmQuery(true)"> Yes </v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>
<script>
export default {
	name: 'generate-page-confirmation-dialog',
	data() {
		return {
			dialog: false,
		};
	},
	methods: {
		showDialog() {
			this.dialog = true;
		},

		hideDialog() {
			this.dialog = false;
		},

		confirmQuery(chosenOption) {
			this.$emit('confirmQuery', { chosenOption });
		},
	},
};
</script>
