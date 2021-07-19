<template>
	<div class="text-center">
		<v-dialog v-model="dialog" width="370" height="90%">
			<v-card v-if="currentCourse" height="90vh">
				<v-card-title class="text-body-1">
					<v-icon left color="primary" small>
						mdi-bookmark-multiple
					</v-icon>
					<span>{{ currentCourse.courseCode }}</span>
				</v-card-title>

				<v-card-text class="pb-2">
					<div class="text-subtitle-1 black--text font-weight-medium">
						{{ currentCourse.courseName }}
					</div>
				</v-card-text>

				<v-card-text class="text-body-1 pb-1">
					<div>
						<span class="black--text font-weight-medium">Course Units:{{ ' ' }}</span>
						<span>{{ currentCourse.units }}</span>
					</div>
					<div>
						<span class="black--text font-weight-medium">Course IC:{{ ' ' }}</span>
						<span>{{ currentCourse.IC }}</span>
					</div>
					<div>
						<span class="black--text font-weight-medium">Comprehensive Exam:{{ ' ' }}</span>
						<span>{{ formattedExamDate(currentCourse.comprehensiveExamDate) }}</span>
					</div>
				</v-card-text>

				<v-card class="mt-2" elevation="6">
					<v-tabs v-model="tab" centered fixed-tabs>
						<v-tab v-for="item in tabItems" :key="item">
							{{ item }}
						</v-tab>
					</v-tabs>
				</v-card>

				<v-tabs-items v-model="tab" elevation="6">
					<!-- Loading time -->
					<div v-if="timingsLoading || !timings">
						<v-tab-item v-for="item in tabItems" :key="item">
							<!-- Timings Loader -->
							<div>
								<v-container>
									<v-row justify="center" class="px-4">
										<v-col cols="12">
											<v-skeleton-loader
												v-bind="skeletonAttrs"
												type="list-item-three-line@3"
											></v-skeleton-loader>
										</v-col>
									</v-row>
								</v-container>
							</div>
						</v-tab-item>
					</div>
					<div v-else>
						<v-tab-item v-for="item in tabItems" :key="item">
							<v-container class="pt-3 mt-1 elevation-6" id="timings-container">
								<div v-if="timings[item].length === 0">
									<v-card class="mt-4 py-5">
										<p class="text-body-1 text-center mb-0">
											NO {{ item.toUpperCase() }} FOR THIS COURSE
										</p>
									</v-card>
								</div>
								<v-expansion-panels focusable v-else>
									<v-expansion-panel
										v-for="section in timings[item]"
										:key="section.section"
										class="mb-2"
									>
										<v-expansion-panel-header class="font-weight-medium">{{
											`${section.section} - ${section.instructors[0]} - [${parsedClassWeekDays(
												section.timings
											)}]`
										}}</v-expansion-panel-header>
										<v-expansion-panel-content class="pt-2">
											<div>
												<p class="text-body-2 mb-1 black--text font-weight-medium">
													Timings:
												</p>
												<p
													class="text-body-2 mb-1 ml-4"
													v-for="timing in section.timings"
													:key="timing.dayCode"
												>
													{{ timing.day }} - {{ timing.time }}
												</p>
											</div>
											<div class="mt-3">
												<p class="text-body-2 mb-1 black--text font-weight-medium">
													Instructors:
												</p>
												<p
													class="text-body-2 mb-1 ml-4"
													v-for="teacher in section.instructors"
													:key="teacher"
												>
													{{ teacher }}
												</p>
											</div>
										</v-expansion-panel-content>
									</v-expansion-panel>
								</v-expansion-panels>
							</v-container>
						</v-tab-item>
					</div>
				</v-tabs-items>
			</v-card>
		</v-dialog>
	</div>
</template>
<script>
import moment from 'moment';
export default {
	name: 'course-info-dialog',
	data() {
		return {
			skeletonAttrs: {
				boilerplate: false,
				elevation: 2,
			},
			dialog: false,
			currentCourse: null,
			tab: null,
			tabItems: ['lectures', 'tutorials', 'labs'],
			timings: null,
			timingsLoading: true,
		};
	},
	methods: {
		showInfo(course) {
			this.dialog = true;
			this.currentCourse = course;
			this.fetchTimings();
		},

		hideInfo() {
			this.dialog = false;
			this.currentCourse = null;
		},

		async fetchTimings() {
			this.timingsLoading = true;
			const { lectures, labs, tutorials } = await this.$store.dispatch('sendRequest', {
				method: 'GET',
				url: `courses/${this.currentCourse._id}`,
			});
			this.timings = { lectures, labs, tutorials };
			this.timingsLoading = false;
		},
	},
	computed: {
		formattedExamDate: () => (date) => {
			let formattedDate = moment(date).format('Do MMM[,] hh:mm A');
			if (formattedDate === 'Invalid date') return 'TBA';
			return formattedDate;
		},

		parsedClassWeekDays: () => (timings) => {
			let desiredString = ``;
			timings.forEach((timing) => (desiredString += `${timing.dayCode}, `));
			return desiredString.substring(0, desiredString.length - 2);
		},
	},
};
</script>
<style scoped>
.v-dialog__content {
	align-items: flex-start;
	justify-content: flex-start;
}
#timings-container {
	max-height: 50vh;
	overflow-y: scroll;
}
#timings-container::-webkit-scrollbar {
	width: 0;
}
</style>
