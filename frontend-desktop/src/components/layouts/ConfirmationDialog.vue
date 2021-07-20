<template>
	<v-row justify="center">
		<v-dialog v-model="dialog" persistent max-width="800" width="fit-content">
			<v-card v-if="currentCourse">
				<v-card-title class="text-overline">
					Are you sure to remove {{ currentCourse.courseName }} ({{ currentCourse.courseCode }})
				</v-card-title>
				<v-card-text>
					<div class="text-body-1">
						This course currently scheduled on your timetable
					</div>
				</v-card-text>
				<v-card-actions>
					<v-spacer></v-spacer>
					<v-btn color="green darken-1" text @click="confirmQuery(false)">
						No
					</v-btn>
					<v-btn color="green darken-1" text @click="confirmQuery(true)">
						Yes
					</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</v-row>
</template>
<script>
export default {
	name: 'confirmation-dialog',
	data() {
		return {
			dialog: false,
			currentCourse: null,
		};
	},
	methods: {
		showDialog(course) {
			this.dialog = true;
			this.currentCourse = course;
		},

		hideDialog() {
			this.dialog = false;
			this.currentCourse = null;
		},

		confirmQuery(choosenOption) {
			this.$emit('confirmQuery', { choosenOption, courseID: this.currentCourse._id });
		},
	},
};
</script>
