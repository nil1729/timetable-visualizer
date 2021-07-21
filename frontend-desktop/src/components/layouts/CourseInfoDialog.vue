<template>
	<div class="text-center">
		<v-dialog v-model="dialog" width="375" height="90%" content-class="my-course-info-dialog">
			<v-card v-if="currentCourse" height="90vh">
				<v-card-title class="text-body-1">
					<v-icon left color="primary" small>
						mdi-bookmark-multiple
					</v-icon>
					<span>{{ currentCourse.courseCode }}</span>
				</v-card-title>

				<v-card-text class="pb-2">
					<div class="text-subtitle-1  font-weight-medium">
						{{ currentCourse.courseName }}
					</div>
				</v-card-text>

				<v-card-text class="text-body-1 pb-1">
					<div>
						<span class=" font-weight-medium">Course Units:{{ ' ' }}</span>
						<span>{{ currentCourse.units }}</span>
					</div>
					<div>
						<span class=" font-weight-medium">Course IC:{{ ' ' }}</span>
						<span>{{ currentCourse.IC }}</span>
					</div>
					<div>
						<span class=" font-weight-medium">Comprehensive Exam:{{ ' ' }}</span>
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
										<v-expansion-panel-header class="font-weight-medium">
											<div class="d-flex justify-start align-center">
												<span>
													<v-checkbox
														@change="checkboxClicked(item, section.section)"
														v-model="checkboxes[item][section.section]"
														class="my-edit-timetable-checkbox"
													></v-checkbox>
												</span>
												<span>
													{{
														`${section.section} - ${
															section.instructors[0]
														} - [${parsedClassWeekDays(section.timings)}]`
													}}
												</span>
											</div>
										</v-expansion-panel-header>
										<v-expansion-panel-content class="pt-2">
											<div>
												<p class="text-body-2 mb-1  font-weight-medium">
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
												<p class="text-body-2 mb-1  font-weight-medium">
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
import { mapGetters } from 'vuex';
import _ from 'lodash';

export default {
	name: 'course-info-dialog',
	data() {
		return {
			skeletonAttrs: {
				boilerplate: false,
				elevation: 2,
			},
			checkboxes: null,
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
			this.tab = 0;
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
			this.setupCheckboxes();
			this.timingsLoading = false;
		},

		setupCheckboxes() {
			let checkboxes = {};
			let timings = this.timings;
			const courseScheduled = this.getCurrentCourseScheduledSections(this.currentCourse._id);

			this.tabItems.forEach((tab) => {
				checkboxes[tab] = {};
				timings[tab].forEach((timeSlot) => {
					let keyword = tab + 'Section';

					if (
						courseScheduled &&
						_.has(courseScheduled, keyword) &&
						_.get(courseScheduled, keyword) &&
						_.get(courseScheduled, keyword).section === timeSlot.section
					) {
						checkboxes[tab][timeSlot.section] = true;
					} else {
						checkboxes[tab][timeSlot.section] = false;
					}
				});
			});

			this.checkboxes = checkboxes;
		},

		async checkboxClicked(sectionType, sectionID) {
			const clickedSection = this.timings[sectionType].find((sc) => sc.section === sectionID);

			if (this.checkboxes[sectionType][sectionID]) {
				const scheduledCourse = this.getCurrentCourseScheduledSections(this.currentCourse._id);
				let oldSection;

				if (scheduledCourse) {
					const keyword = sectionType + 'Section';
					oldSection = _.has(scheduledCourse, keyword) && _.get(scheduledCourse, keyword);
				}

				const { success } = await this.$store.dispatch('addSectionToSchedule', {
					sectionType,
					section: clickedSection,
					course: this.currentCourse,
					oldSection,
				});

				if (!success) {
					this.checkboxes[sectionType][sectionID] = false;
				} else this.setupCheckboxes();
			} else {
				this.$store.dispatch('removeSectionFromSchedule', {
					sectionType,
					section: clickedSection,
					course: this.currentCourse,
				});
			}
		},
	},
	computed: {
		...mapGetters(['getCurrentCourseScheduledSections']),
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
<style>
.my-course-info-dialog {
	position: absolute;
	left: 0;
}
#timings-container {
	max-height: 50vh;
	overflow-y: scroll;
}
#timings-container::-webkit-scrollbar {
	width: 0;
}
.my-edit-timetable-checkbox {
	margin: 0 !important;
	padding: 0 !important;
	flex: 0 !important;
}
.my-edit-timetable-checkbox .v-input__control .v-input__slot {
	margin: 0 !important;
}

.my-edit-timetable-checkbox .v-input__control .v-messages {
	display: none !important;
}
</style>
