<template>
	<div>
		<div class="my-horizontal-container">
			<div v-if="loading" class="my-container">
				<v-skeleton-loader
					v-for="i in 4"
					:key="i"
					v-bind="skeletonAttrs"
					type="card-avatar, article, actions"
					class="my-generate-course-card"
				></v-skeleton-loader>
			</div>
			<div class="my-container" v-else>
				<v-card
					v-for="currentCourse in courseDetailsArr"
					:key="currentCourse._id"
					class="my-generate-course-card"
				>
					<v-card-title class="text-body-1 pb-1">
						<v-icon left color="primary" small> mdi-bookmark-multiple </v-icon>
						<span>{{ currentCourse.courseCode }}</span>
					</v-card-title>
					<v-card-text class="pb-1">
						<div class="text-subtitle-1 font-weight-medium">
							{{ currentCourse.courseName }}
						</div>
					</v-card-text>

					<v-card-text class="text-body-1 pb-1 pt-1">
						<div>
							<span class="font-weight-medium">Course Units:{{ ' ' }}</span>
							<span>{{ currentCourse.units }}</span>
						</div>
						<div>
							<span class="font-weight-medium">Course IC:{{ ' ' }}</span>
							<span>{{ currentCourse.IC }}</span>
						</div>
						<div>
							<span class="font-weight-medium">Comprehensive Exam:{{ ' ' }}</span>
							<span>{{ formattedExamDate(currentCourse.comprehensiveExamDate) }}</span>
						</div>
					</v-card-text>

					<v-card class="mt-2" elevation="6">
						<v-tabs v-model="currentCourse.tab" centered fixed-tabs>
							<v-tab v-for="item in tabItems" :key="item">
								{{ item }}
							</v-tab>
						</v-tabs>
					</v-card>

					<v-tabs-items v-model="currentCourse.tab" elevation="6">
						<div>
							<v-tab-item v-for="item in tabItems" :key="item">
								<v-container class="pt-3 mt-1 elevation-6" id="timings-container">
									<div v-if="currentCourse[item].length === 0">
										<v-card class="mt-4 py-5">
											<p class="text-body-1 text-center mb-0">
												NO {{ item.toUpperCase() }} FOR THIS COURSE
											</p>
										</v-card>
									</div>
									<v-expansion-panels focusable v-else>
										<v-expansion-panel
											v-for="section in currentCourse[item]"
											:key="section.section"
											class="mb-2"
										>
											<v-expansion-panel-header class="font-weight-medium">
												<div class="d-flex justify-start align-center">
													<span>
														{{
															`${section.section} - ${
																section.instructors[0]
															} - [${parsedClassWeekDays(section.timings)}]`
														}}
													</span>
													<div v-if="section.newSection" class="new-section-tag">
														<v-tooltip left>
															<template v-slot:activator="{ on, attrs }">
																<v-icon color="warning" v-bind="attrs" v-on="on" small>
																	mdi-alert-decagram
																</v-icon>
															</template>
															<span>For New Admissions</span>
														</v-tooltip>
													</div>
												</div>
											</v-expansion-panel-header>
											<v-expansion-panel-content class="pt-2">
												<div>
													<p class="text-body-2 mb-1 font-weight-medium">Timings:</p>
													<p
														class="text-body-2 mb-1 ml-4"
														v-for="timing in section.timings"
														:key="timing.dayCode"
													>
														{{ timing.day }} - {{ timing.time }}
													</p>
												</div>
												<div class="mt-3">
													<p class="text-body-2 mb-1 font-weight-medium">Instructors:</p>
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
			</div>
		</div>
		<div class="submit-btn text-center mb-5 mt-3" v-if="!loading">
			<v-btn
				color="info"
				@click="generateTimetable"
				tile
				:loading="generating"
				:disabled="generating"
			>
				Generate Timetable
				<v-icon right dark>mdi-cog-play-outline</v-icon>
				<template v-slot:loader>
					<span class="custom-loader">
						<v-icon light>mdi-cached</v-icon>
					</span>
				</template>
			</v-btn>
		</div>
	</div>
</template>

<script>
// import _ from 'lodash';
import moment from 'moment';
import { mapGetters } from 'vuex';
export default {
	name: 'generate-timetable',
	data: () => ({
		skeletonAttrs: {
			class: 'mb-1',
			boilerplate: false,
			elevation: 2,
		},
		courseDetailsArr: [],
		tabItems: ['lectures', 'tutorials', 'labs'],
		loading: true,
		generating: false,
	}),
	computed: {
		...mapGetters(['getUserCoursesWithTag']),
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
	methods: {
		async fetchCourseDetails() {
			this.loading = true;
			try {
				await this.$store.dispatch('getUserCourses');
				const course_ids = this.getUserCoursesWithTag.map((it) => it._id).join(',');
				const resp = await this.$store.dispatch('sendRequest', {
					method: 'GET',
					url: `courses/generate/course_details?course_ids=${course_ids}`,
				});
				this.courseDetailsArr = resp.map((item) => {
					return {
						...item,
						tab: null,
					};
				});
				this.loading = false;
			} catch (err) {
				console.error(err);
			}
		},

		async generateTimetable() {
			this.generating = true;
		},
	},

	async mounted() {
		await this.fetchCourseDetails();
	},
};
</script>
<style scoped>
.my-horizontal-container {
	width: 90%;
	height: 85vh;
	margin: auto;
	overflow-y: hidden;
	overflow-x: scroll;
	display: flex;
	justify-content: flex-start;
	align-items: center;
}
.my-container {
	display: flex;
	height: 95%;
}
.my-generate-course-card {
	width: 380px !important;
	height: 100%;
	margin: 5px 10px;
	/* margin: 10px 20px; */
}

.disabled-btn {
	pointer-events: none !important;
}

/* Custom Loader */

.custom-loader {
	animation: loader 1s infinite;
	display: flex;
}
@-moz-keyframes loader {
	from {
		transform: rotate(0);
	}
	to {
		transform: rotate(360deg);
	}
}
@-webkit-keyframes loader {
	from {
		transform: rotate(0);
	}
	to {
		transform: rotate(360deg);
	}
}
@-o-keyframes loader {
	from {
		transform: rotate(0);
	}
	to {
		transform: rotate(360deg);
	}
}
@keyframes loader {
	from {
		transform: rotate(0);
	}
	to {
		transform: rotate(360deg);
	}
}
</style>
