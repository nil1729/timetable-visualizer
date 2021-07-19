<template>
	<div>
		<v-container fluid class="px-8 mt-3 mb-8">
			<v-row justify="center">
				<v-col cols="3">
					<div v-if="coursesFetching || !userCourses">
						<v-skeleton-loader
							v-for="n in 2"
							:key="n"
							v-bind="skeletonAttrs"
							type="article, actions"
						></v-skeleton-loader>
					</div>
					<div v-else-if="!coursesFetching && userCourses && userCourses.length === 0">
						<v-container>
							<v-row justify="center">
								<v-img contain src="@/assets/empty.png"></v-img>
								<p class="text-overline text-center">
									Your Course Collection is Empty
								</p>
							</v-row>
						</v-container>
					</div>
					<div v-else>
						<div class="pagination-block">
							<v-container class="max-width my-0 py-0">
								<v-pagination
									v-model="pagination.page"
									class="mt-0 mb-2"
									:length="pagination.totalPages"
									:total-visible="3"
									@input="paginationClicked"
								></v-pagination>
							</v-container>
						</div>
						<div class="cards-block">
							<v-card
								v-for="course in pagination.currentPageCourse"
								:key="course._id"
								class="mx-auto mb-4"
								max-width="400"
							>
								<v-tooltip right>
									<template v-slot:activator="{ on, attrs }">
										<v-icon
											@click="removeCourse(course._id)"
											class="my-remove-icon"
											color="error"
											v-bind="attrs"
											v-on="on"
											>mdi-delete-outline</v-icon
										>
									</template>
									<span>Remove Course</span>
								</v-tooltip>

								<v-card-text class="mb-0 pb-0">
									<div class="text-subtitle-2 mb-1 primary--text">
										<v-icon left color="primary" small>
											mdi-bookmark-multiple
										</v-icon>
										<span>{{ course.courseCode }}</span>
									</div>
									<div class="text-subtitle-2 black--text font-weight-medium">
										{{ course.courseName }}
									</div>
								</v-card-text>

								<v-card-text class="pt-1 pb-2 d-flex justify-space-between text-body-2 black--text">
									<div>
										<span class="font-weight-medium">Units:{{ ' ' }}</span>
										<span>{{ course.units > 0 ? course.units : 'NA' }}</span>
									</div>
									<div>
										<span class="font-weight-medium">Lec:{{ ' ' }}</span>
										<span>{{ course.lectures > 0 ? course.lectures : 'NA' }}</span>
									</div>
									<div>
										<span class="font-weight-medium">Tut:{{ ' ' }}</span>
										<span>{{ course.tutorials > 0 ? course.tutorials : 'NA' }}</span>
									</div>
									<div>
										<span class="font-weight-medium">Lab:{{ ' ' }}</span>
										<span>{{ course.labs > 0 ? course.labs : 'NA' }}</span>
									</div>
								</v-card-text>

								<v-card-actions>
									<v-row align="center" justify="center" class="px-2 pb-2">
										<v-btn
											class="ma-2 "
											:class="{ 'disabled-btn': course.added }"
											:color="course.added ? 'success' : 'primary'"
											small
											depressed
											@click="showCourseInfo(course)"
											:tile="course.added"
											:outlined="!course.added"
										>
											<v-icon left v-if="course.added">mdi-marker-check</v-icon>
											<v-icon left v-else>mdi-calendar-plus</v-icon>
											{{ course.added ? 'course added' : 'schedule class' }}
										</v-btn>
									</v-row>
								</v-card-actions>
							</v-card>
						</div>
					</div>
				</v-col>
				<v-col cols="9">
					<v-row class="fill-height">
						<v-col>
							<v-sheet>
								<v-calendar
									ref="calendar"
									v-model="focus"
									color="primary"
									:events="events"
									:event-color="getEventColor"
									:type="type"
									:first-interval="7"
									:interval-minutes="60"
									:interval-count="12"
									:weekday-format="formatDayString"
									@click:event="showEvent"
									@change="updateRange"
								></v-calendar>
								<v-menu
									v-model="selectedOpen"
									:close-on-content-click="false"
									:activator="selectedElement"
									offset-x
								>
									<v-card color="grey lighten-4" min-width="350px" flat>
										<v-toolbar :color="selectedEvent.color" dark>
											<v-btn icon>
												<v-icon>mdi-pencil</v-icon>
											</v-btn>
											<v-toolbar-title v-html="selectedEvent.name"></v-toolbar-title>
											<v-spacer></v-spacer>
											<v-btn icon>
												<v-icon>mdi-heart</v-icon>
											</v-btn>
											<v-btn icon>
												<v-icon>mdi-dots-vertical</v-icon>
											</v-btn>
										</v-toolbar>
										<v-card-text>
											<span v-html="selectedEvent.details"></span>
										</v-card-text>
										<v-card-actions>
											<v-btn text color="secondary" @click="selectedOpen = false">
												Cancel
											</v-btn>
										</v-card-actions>
									</v-card>
								</v-menu>
							</v-sheet>
						</v-col>
					</v-row>
				</v-col>
			</v-row>
		</v-container>
		<course-info-dialog ref="courseInformation" />
	</div>
</template>

<script>
import CourseInfoDialog from '@/components/layouts/CourseInfoDialog.vue';
import _ from 'lodash';

export default {
	name: 'edit-timetable',
	components: {
		'course-info-dialog': CourseInfoDialog,
	},
	data: () => ({
		skeletonAttrs: {
			class: 'mb-5',
			boilerplate: false,
			elevation: 2,
		},
		userCourses: null,
		coursesFetching: false,
		pagination: {
			currentPageCourse: [],
			page: 1,
			totalPages: 0,
			pageLimit: 3,
			totalUserCourses: 0,
		},
		focus: '',
		type: 'week',
		typeToLabel: {
			month: 'Month',
			week: 'Week',
			day: 'Day',
			'4day': '4 Days',
		},
		selectedEvent: {},
		selectedElement: null,
		selectedOpen: false,
		events: [],
		weekdaysStrings: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
		colors: ['blue', 'indigo', 'deep-purple', 'cyan', 'green', 'orange', 'grey darken-1'],
		names: ['Meeting', 'Holiday', 'PTO', 'Travel', 'Event', 'Birthday', 'Conference', 'Party'],
	}),

	async mounted() {
		this.$refs.calendar.checkChange();
		await this.fetchUserCourses();

		if (_.has(this.$route.query, 'course_id')) {
			const courseID = _.get(this.$route.query, 'course_id');
			const requestedCourse = this.userCourses.find((course) => course._id === courseID);
			if (requestedCourse) this.$refs.courseInformation.showInfo(requestedCourse);
			else
				this.$store.commit('ADD_NOTIFICATION', {
					message: `NOT FOUND ANY COURSE WITH REQUESTED ID`,
					type: 'error',
				});
		}
	},

	methods: {
		async fetchUserCourses() {
			this.coursesFetching = true;
			this.userCourses = await this.$store.dispatch('getUserCourses');
			this.setUpPagination();
			this.coursesFetching = false;
		},

		setUpPagination(page_number = 1, page_size = 3) {
			this.pagination = {
				currentPageCourse: this.userCourses.slice(
					(page_number - 1) * page_size,
					page_number * page_size
				),
				page: page_number,
				totalPages: Math.ceil(this.userCourses.length / page_size),
				pageLimit: page_size,
				totalUserCourses: this.userCourses.length,
			};
		},

		paginationClicked(currentPage) {
			this.setUpPagination(currentPage);
		},

		async removeCourse(courseID) {
			const deletedCourse = this.userCourses.find((course) => course._id === courseID);
			await this.$store.dispatch('removeCourseFromUserStore', deletedCourse);

			if (_.has(this.$route.query, 'course_id')) {
				const requestedCourseID = _.get(this.$route.query, 'course_id');
				if (requestedCourseID === courseID)
					this.$router.replace({
						name: 'EditTimetable',
						query: { ...this.$route.query, course_id: undefined },
					});
			}

			this.userCourses = this.userCourses.filter((courses) => courses._id !== courseID);
			this.setUpPagination();
		},

		async showCourseInfo(course) {
			if (_.has(this.$route.query, 'course_id')) {
				const requestedCourseID = _.get(this.$route.query, 'course_id');
				if (requestedCourseID === course._id) {
					this.$refs.courseInformation.showInfo(course);
					return;
				}
			}
			this.$router.replace({
				name: 'EditTimetable',
				query: { ...this.$route.query, course_id: course._id },
			});
			this.$refs.courseInformation.showInfo(course);
		},

		formatDayString(e) {
			return this.weekdaysStrings[e.weekday];
		},
		getEventColor(event) {
			return event.color;
		},
		setToday() {
			this.focus = '';
		},
		prev() {
			this.$refs.calendar.prev();
		},
		next() {
			this.$refs.calendar.next();
		},
		showEvent({ nativeEvent, event }) {
			const open = () => {
				this.selectedEvent = event;
				this.selectedElement = nativeEvent.target;
				requestAnimationFrame(() => requestAnimationFrame(() => (this.selectedOpen = true)));
			};

			if (this.selectedOpen) {
				this.selectedOpen = false;
				requestAnimationFrame(() => requestAnimationFrame(() => open()));
			} else {
				open();
			}

			nativeEvent.stopPropagation();
		},
		updateRange() {
			const events = [];

			// const min = new Date(`${start.date}T00:00:00`);
			// const max = new Date(`${end.date}T23:59:59`);
			// const days = (max.getTime() - min.getTime()) / 86400000;
			// const eventCount = this.rnd(days, days + 20);

			// for (let i = 0; i < eventCount; i++) {
			// 	const allDay = this.rnd(0, 3) === 0;
			// 	const firstTimestamp = this.rnd(min.getTime(), max.getTime());
			// 	const first = new Date(firstTimestamp - (firstTimestamp % 900000));
			// 	const secondTimestamp = this.rnd(2, allDay ? 288 : 8) * 900000;
			// 	const second = new Date(first.getTime() + secondTimestamp);

			// 	events.push({
			// 		name: this.names[this.rnd(0, this.names.length - 1)],
			// 		start: first,
			// 		end: second,
			// 		color: this.colors[this.rnd(0, this.colors.length - 1)],
			// 		timed: !allDay,
			// 	});
			// }

			this.events = events;
		},
		rnd(a, b) {
			return Math.floor((b - a + 1) * Math.random()) + a;
		},
	},
};
</script>
<style scoped>
/* .v-btn--fab.v-size--default {
	height: 35px !important;
	width: 35px !important;
} */
.my-remove-icon {
	position: absolute;
	right: 3%;
	top: 6%;
	cursor: pointer;
}
</style>
