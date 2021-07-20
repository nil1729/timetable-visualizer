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
									class="my-edit-calender"
									ref="calendar"
									v-model="focus"
									color="primary"
									:events="events"
									:event-color="getEventColor"
									:type="type"
									:first-interval="8"
									:interval-minutes="60"
									:interval-count="12"
									:weekday-format="formatDayString"
									@click:event="showEvent"
									@change="updateRange"
								>
									<template v-slot:event="{ event, timeSummary }">
										<div class="pl-1 m-0 black--text">
											<strong>{{ event.name }}</strong>
											<br />
											{{ timeSummary() }}
										</div>
									</template>
								</v-calendar>
								<v-menu
									v-model="selectedOpen"
									:close-on-content-click="false"
									:activator="selectedElement"
									offset-x
								>
									<v-card color="grey lighten-4" min-width="350px" dense flat>
										<v-toolbar :color="selectedEvent.color" height="50px">
											<v-btn icon @click="editSchedule(selectedEvent.courseID)">
												<v-icon>mdi-pencil</v-icon>
											</v-btn>
											<v-toolbar-title v-html="selectedEvent.name"></v-toolbar-title>
										</v-toolbar>
										<v-card-text>
											<span v-html="selectedEvent.details"></span>
										</v-card-text>
									</v-card>
								</v-menu>
							</v-sheet>
						</v-col>
					</v-row>
				</v-col>
			</v-row>
		</v-container>
		<course-info-dialog ref="courseInformation" />
		<confirmation-dialog ref="confirmationDialog" @confirmQuery="confirmationSubmit" />
	</div>
</template>

<script>
import CourseInfoDialog from '@/components/layouts/CourseInfoDialog.vue';
import ConfirmationDialog from '@/components/layouts/ConfirmationDialog.vue';
import _ from 'lodash';
import moment from 'moment';
import { mapGetters } from 'vuex';

export default {
	name: 'edit-timetable',
	components: {
		'course-info-dialog': CourseInfoDialog,
		'confirmation-dialog': ConfirmationDialog,
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
			pageLimit: 4,
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
		colorsMapper: {
			labs: 'purple accent-1',
			lectures: 'green accent-2',
			tutorials: 'orange accent-1',
		},
		typesMapper: {
			labs: 'Practical',
			lectures: 'Lecture',
			tutorials: 'Tutorial',
		},
		daysMapper: {
			0: 'Su',
			1: 'M',
			2: 'T',
			3: 'W',
			4: 'Th',
			5: 'F',
			6: 'S',
		},
	}),

	computed: {
		...mapGetters(['getScheduledCourses', 'getCurrentCourseScheduledSections']),
	},

	async mounted() {
		this.$refs.calendar.checkChange();
		await this.fetchUserCourses();
		await this.$store.dispatch('initializateSchedule');

		if (_.has(this.$route.query, 'course_id')) {
			const courseID = _.get(this.$route.query, 'course_id');
			const requestedCourse = this.userCourses.find((course) => course._id === courseID);
			if (requestedCourse) this.$refs.courseInformation.showInfo(requestedCourse);
			else {
				this.$router.replace({
					name: 'EditTimetable',
					query: { ...this.$route.query, course_id: undefined },
				});
				this.$store.commit('ADD_NOTIFICATION', {
					message: `NOT FOUND ANY COURSE WITH REQUESTED ID`,
					type: 'error',
				});
			}
		}
	},

	watch: {
		getScheduledCourses: function(newVal) {
			let daysArr = this.getDaysArray(this.startTimestamp.date, this.endTimestamp.date);
			this.setCalenderSlots(daysArr, newVal);
		},
	},

	methods: {
		async fetchUserCourses() {
			this.coursesFetching = true;
			this.userCourses = await this.$store.dispatch('getUserCourses');
			this.setUpPagination();
			this.coursesFetching = false;
		},

		setUpPagination(page_number = 1, page_size = 4) {
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
			const courseScheduled = this.getCurrentCourseScheduledSections(deletedCourse._id);

			if (courseScheduled) {
				this.$refs.confirmationDialog.showDialog(courseScheduled);
			} else {
				this.confirmRemove(deletedCourse);
			}
		},

		async confirmationSubmit({ choosenOption, courseID }) {
			if (choosenOption) {
				const deletedCourse = this.userCourses.find((course) => course._id === courseID);
				this.confirmRemove(deletedCourse);
			}
			this.$refs.confirmationDialog.hideDialog();
		},

		async confirmRemove(course) {
			if (_.has(this.$route.query, 'course_id')) {
				const requestedCourseID = _.get(this.$route.query, 'course_id');
				if (requestedCourseID === course._id)
					this.$router.replace({
						name: 'EditTimetable',
						query: { ...this.$route.query, course_id: undefined },
					});
			}

			await this.$store.dispatch('removeCourseFromUserStore', course);

			this.userCourses = this.userCourses.filter((courses) => courses._id !== course._id);
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

		updateRange({ start, end }) {
			this.startTimestamp = start;
			this.endTimestamp = end;
			let daysArr = this.getDaysArray(start.date, end.date);
			this.setCalenderSlots(daysArr);
		},

		getDaysArray(start, end) {
			var arr = [];
			for (let dt = new Date(start); dt <= new Date(end); dt.setDate(dt.getDate() + 1)) {
				arr.push(new Date(dt));
			}
			return arr;
		},

		setCalenderSlots(daysArr) {
			let events = [];
			let courses = this.getScheduledCourses;

			for (let j = 0; j < daysArr.length; j++) {
				let curDt = daysArr[j];
				for (let i = 0; i < courses.length; i++) {
					let sb = courses[i];
					let lec = _.has(sb, 'lecturesSection') && _.get(sb, 'lecturesSection'),
						tut = _.has(sb, 'tutorialsSection') && _.get(sb, 'tutorialsSection'),
						lab = _.has(sb, 'labsSection') && _.get(sb, 'labsSection');
					if (lec) events.push(...this.setSlots(sb, curDt, 'lectures'));
					if (tut) events.push(...this.setSlots(sb, curDt, 'tutorials'));
					if (lab) events.push(...this.setSlots(sb, curDt, 'labs'));
				}
			}
			this.events = events;
		},

		setSlots(course, date, type) {
			let slots = [];
			let currSlot = course[`${type}Section`];
			let timings = currSlot.timings;
			let curDtCode = this.daysMapper[date.getDay()];
			let hasClass = timings.findIndex((it) => it.dayCode === curDtCode);
			if (hasClass >= 0) {
				let classHour = timings[hasClass].time;
				let [s, e] = classHour.split(' - ');
				let startEvent = `${date.toISOString().substr(0, 10)} ${s}`;
				let endEvent = `${date.toISOString().substr(0, 10)} ${e}`;
				let instructorsList = ``;
				currSlot.instructors.forEach((it) => (instructorsList += `<li>${it}</li>`));
				let evData = {
					start: startEvent,
					end: endEvent,
					color: this.colorsMapper[type],
					name: `${course.courseCode} - ${currSlot.section}`,
					title: `${course.courseName}`,
					courseID: course._id,
					details: `
						<h4>${this.typesMapper[type]} Section - ${currSlot.section}</h4>
						<h4>Instructor(s)</h4>
						<ul>
							${instructorsList}
						</ul>
						<h4>Comprehensive Exam: ${moment(course.comprehensiveExamDate).format('Do MMM,  h:mm A')}</h4>
						<h4>Course IC: ${course.IC}</h4>
					`,
				};
				slots.push(evData);
			}
			return slots;
		},

		showEvent({ nativeEvent, event }) {
			const open = () => {
				this.selectedEvent = event;
				this.selectedElement = nativeEvent.target;
				setTimeout(() => {
					this.selectedOpen = true;
				}, 10);
			};
			if (this.selectedOpen) {
				this.selectedOpen = false;
				setTimeout(open, 10);
			} else {
				open();
			}
			nativeEvent.stopPropagation();
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

		editSchedule(courseID) {
			const requestedCourse = this.userCourses.find((course) => course._id === courseID);
			this.showCourseInfo(requestedCourse);
		},
	},
};
</script>
<style scoped>
.my-remove-icon {
	position: absolute;
	right: 3%;
	top: 6%;
	cursor: pointer;
}
</style>
