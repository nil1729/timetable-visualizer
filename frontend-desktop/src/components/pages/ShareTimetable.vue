<template>
	<div>
		<v-container fluid>
			<v-card>
				<v-toolbar flat dense color="info" dark>
					<v-toolbar-title class="ma-auto">
						<span class="text-centre text-overline">
							Share Timetable with your friends
							<v-icon>mdi-account-group-outline</v-icon>
						</span>
					</v-toolbar-title>
				</v-toolbar>
				<v-tabs vertical v-model="selectedTab">
					<v-tab>
						<v-icon left> mdi-calendar-import </v-icon>
						import
					</v-tab>
					<v-tab>
						<v-icon left> mdi-calendar-export </v-icon>
						export
					</v-tab>

					<v-tab-item>
						<v-card flat>
							<v-container class="mt-2 import-container">
								<v-row justify="center">
									<v-col cols="8" class="pb-0 mb-0">
										<v-text-field
											ref="importForm"
											v-model="importTimetable.typedShareID"
											label="Paste the Share ID ..."
											type="text"
											clear-icon="mdi-close"
											append-outer-icon="mdi-send"
											solo
											dense
											clearable
											:rules="[
												() => !!importTimetable.typedShareID || 'This field is required',
												() =>
													(importTimetable.typedShareID &&
														importTimetable.typedShareID.length === 32) ||
													'Share ID must be 32 characters long',
											]"
											@focus="importTimetable.inputfocused = true"
											@blur="importTimetable.inputfocused = false"
											@click:append-outer="fetchTimetable"
											counter="32"
											required
										>
											<template v-slot:prepend-inner>
												<div class="mr-3">
													<v-icon :color="importTimetable.inputfocused ? 'primary' : ''"
														>mdi-share-variant</v-icon
													>
												</div>
											</template>
										</v-text-field>
									</v-col>
									<v-col cols="3" class="pb-0 mb-0 text-center">
										<v-btn
											outlined
											tile
											color="primary"
											depressed
											v-if="!importTimetable.timetableLoading && importTimetable.timetableExists"
											@click="takeScreenshot"
										>
											<v-icon left>mdi-camera</v-icon>
											save timetable
										</v-btn>
									</v-col>
								</v-row>
								<v-row justify="center">
									<v-col cols="12">
										<v-sheet v-if="importTimetable.timetableLoading">
											<v-skeleton-loader class="mx-auto" type="table"></v-skeleton-loader>
										</v-sheet>
										<v-row
											class="fill-height"
											v-else-if="
												!importTimetable.timetableLoading && importTimetable.timetableExists
											"
										>
											<v-col>
												<v-sheet id="my-imported-timetable-box">
													<v-calendar
														class="my-view-calender my-import-timetable-calendar"
														ref="calendar"
														v-model="importTimetable.focus"
														color="primary"
														:events="importTimetable.events"
														:event-color="getEventColor"
														type="week"
														:first-interval="8"
														:interval-minutes="60"
														:interval-count="12"
														:weekday-format="formatDayString"
														@click:event="showEvent"
														@change="updateRange"
														:interval-height="60"
														:interval-style="intervalStyle"
													>
														<template v-slot:event="{ event }">
															<div class="pl-1 m-0 black--text">
																<strong>{{ event.name }}</strong>
																<br />
																{{
																	event.title.length > 19
																		? event.title.slice(0, 19) + '...'
																		: event.title
																}}
																<br />
																{{ event.manualTimeSummary }}
															</div>
														</template>
													</v-calendar>
													<v-menu
														v-model="importTimetable.selectedOpen"
														:close-on-content-click="false"
														:activator="importTimetable.selectedElement"
														offset-x
													>
														<v-card color="grey lighten-4" min-width="350px" dense flat>
															<v-toolbar :color="importTimetable.selectedEvent.color" height="50px">
																<v-toolbar-title class="pl-1">
																	<span class="black--text">{{
																		importTimetable.selectedEvent.title
																	}}</span>
																</v-toolbar-title>
															</v-toolbar>
															<v-card-text>
																<span v-html="importTimetable.selectedEvent.details"></span>
															</v-card-text>
														</v-card>
													</v-menu>
												</v-sheet>
											</v-col>
										</v-row>
									</v-col>
								</v-row>
							</v-container>
						</v-card>
					</v-tab-item>
					<v-tab-item>
						<v-card flat>
							<v-container class="mt-2 import-container">
								<v-row justify="center">
									<v-col cols="8" class="pb-0 mb-0">
										<v-text-field
											v-model="exportTimetable.shareID"
											label="Exported Share ID"
											dense
											type="text"
											solo
											readonly
											append-outer-icon="mdi-content-copy"
											@click:append-outer="copyExportedLink"
											ref="myTimetableExportedID"
										>
											<template v-slot:prepend-inner>
												<div class="mr-3">
													<v-icon> mdi-share-variant </v-icon>
												</div>
											</template>
										</v-text-field>
									</v-col>
									<v-col cols="3" class="pb-0 mb-0 text-center">
										<v-btn
											outlined
											tile
											color="primary"
											depressed
											v-if="
												!exportTimetable.timetableLoading &&
												exportTimetable.timetableExists &&
												!myTimetableExported
											"
											@click="exportMyTimetable"
										>
											<v-icon left>mdi-share-outline</v-icon>
											export timetable
										</v-btn>
									</v-col>
								</v-row>
								<v-row justify="center">
									<v-col cols="12">
										<v-sheet v-if="exportTimetable.timetableLoading">
											<v-skeleton-loader class="mx-auto" type="table"></v-skeleton-loader>
										</v-sheet>
										<v-row
											class="fill-height"
											v-else-if="
												!exportTimetable.timetableLoading && exportTimetable.timetableExists
											"
										>
											<v-col>
												<v-sheet id="my-imported-timetable-box">
													<v-calendar
														class="my-view-calender"
														ref="calendar"
														v-model="exportTimetable.focus"
														color="primary"
														:events="exportTimetable.events"
														:event-color="getEventColor"
														type="week"
														:first-interval="8"
														:interval-minutes="60"
														:interval-count="12"
														:weekday-format="formatDayString"
														@click:event="showEvent"
														@change="updateRange"
														:interval-height="60"
														:interval-style="intervalStyle"
													>
														<template v-slot:event="{ event }">
															<div class="pl-1 m-0 black--text">
																<strong>{{ event.name }}</strong>
																<br />
																{{
																	event.title.length > 19
																		? event.title.slice(0, 19) + '...'
																		: event.title
																}}
																<br />
																{{ event.manualTimeSummary }}
															</div>
														</template>
													</v-calendar>
													<v-menu
														v-model="exportTimetable.selectedOpen"
														:close-on-content-click="false"
														:activator="exportTimetable.selectedElement"
														offset-x
													>
														<v-card color="grey lighten-4" min-width="350px" dense flat>
															<v-toolbar :color="exportTimetable.selectedEvent.color" height="50px">
																<v-btn
																	icon
																	@click="editSchedule(exportTimetable.selectedEvent.courseID)"
																>
																	<v-icon color="black">mdi-pencil</v-icon>
																</v-btn>
																<v-toolbar-title class="pl-1">
																	<span class="black--text">{{
																		exportTimetable.selectedEvent.title
																	}}</span>
																</v-toolbar-title>
															</v-toolbar>
															<v-card-text>
																<span v-html="exportTimetable.selectedEvent.details"></span>
															</v-card-text>
														</v-card>
													</v-menu>
												</v-sheet>
											</v-col>
										</v-row>
									</v-col>
								</v-row>
							</v-container>
						</v-card>
					</v-tab-item>
				</v-tabs>
			</v-card>
		</v-container>
		<my-show-screenshot ref="myScreenshotViewer" @confirmQuery="saveScreenshot" />
		<v-overlay :value="exportingMyTimetable">
			<v-progress-circular indeterminate size="64"></v-progress-circular>
		</v-overlay>
	</div>
</template>

<script>
import _ from 'lodash';
import moment from 'moment';
import html2canvas from 'html2canvas';
import ShowScreenshots from '@/components/layouts/ShowScreenshot.vue';

export default {
	name: 'share-timetable',
	components: {
		'my-show-screenshot': ShowScreenshots,
	},
	data: () => ({
		selectedTab: 0,
		exportingMyTimetable: false,
		myTimetableExported: false,
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
		importTimetable: {
			currentRenderedID: null,
			typedShareID: '',
			inputfocused: false,
			timetableLoading: false,
			timetableExists: false,
			showHint: false,
			focus: '',
			selectedEvent: {},
			selectedElement: null,
			selectedOpen: false,
			events: [],
			scheduledCourses: [],
		},
		exportTimetable: {
			shareID: '',
			inputfocused: false,
			timetableLoading: false,
			timetableExists: false,
			showHint: false,
			focus: '',
			selectedEvent: {},
			selectedElement: null,
			selectedOpen: false,
			events: [],
			scheduledCourses: [],
		},
		endTimeMapper: {
			'08:50': '09:00',
			'09:50': '10:00',
			'10:50': '11:00',
			'11:50': '12:00',
			'12:50': '13:00',
			'13:50': '14:00',
			'14:50': '15:00',
			'15:50': '16:00',
			'16:50': '17:00',
			'17:50': '18:00',
			'18:50': '19:00',
			'19:50': '20:00',
		},
	}),

	watch: {
		selectedTab: function (newVal) {
			if (newVal === 1) this.fecthMyTimetable();
		},
	},

	async mounted() {
		if (_.has(this.$route.query, 'share_id')) {
			const shareID = _.get(this.$route.query, 'share_id');

			const { scheduledCourses, error } = await this.$store.dispatch('sendRequest', {
				method: 'GET',
				url: `timetable/import/${shareID}`,
			});

			if (Array.isArray(scheduledCourses)) {
				this.importTimetable.scheduledCourses = this.parseCourses(scheduledCourses);
				this.importTimetable.timetableExists = true;
				this.importTimetable.currentRenderedID = shareID;
				this.importTimetable.typedShareID = shareID;
			} else {
				this.$store.commit('ADD_NOTIFICATION', {
					message: _.upperCase(error),
					type: 'error',
				});
			}
		}
	},

	methods: {
		intervalStyle() {
			return {
				width: '155px',
			};
		},

		editSchedule(courseID) {
			this.$router.push({
				name: 'EditTimetable',
				query: { ...this.$route.query, course_id: courseID },
			});
		},

		async fetchTimetable() {
			try {
				let shareID = this.importTimetable.typedShareID;

				if (
					!shareID ||
					shareID.trim().length !== 32 ||
					this.importTimetable.currentRenderedID === shareID
				) {
					this.$refs.importForm.validate(true);
					return;
				}

				this.importTimetable.timetableLoading = true;
				this.importTimetable.timetableExists = false;

				const { scheduledCourses, error } = await this.$store.dispatch('sendRequest', {
					method: 'GET',
					url: `timetable/import/${shareID}`,
				});

				if (Array.isArray(scheduledCourses)) {
					if (shareID !== this.$route.query.share_id)
						this.$router.replace({
							name: 'ShareTimetable',
							query: { ...this.$route.query, share_id: shareID },
						});
					this.importTimetable.scheduledCourses = this.parseCourses(scheduledCourses);
					this.importTimetable.timetableExists = true;
					this.importTimetable.currentRenderedID = shareID;
				} else {
					this.$store.commit('ADD_NOTIFICATION', {
						message: _.upperCase(error),
						type: 'error',
					});
				}
			} catch (e) {
				console.log(e);
			}

			this.importTimetable.timetableLoading = false;
		},

		async fecthMyTimetable() {
			try {
				const myCourses = await this.$store.dispatch('getMyScheduledCourses');

				this.exportTimetable.timetableLoading = true;
				this.exportTimetable.timetableExists = false;

				if (Array.isArray(myCourses)) {
					this.exportTimetable.scheduledCourses = myCourses;
					this.exportTimetable.timetableExists = true;
				}
			} catch (e) {
				console.log(e);
			}

			this.exportTimetable.timetableLoading = false;
		},

		parseCourses(sharedCourses) {
			return sharedCourses.map((c) => {
				return {
					...c,
					...c.courseDetail,
					courseDetail: undefined,
					course: undefined,
				};
			});
		},

		viewDay({ date }) {
			this.focus = date;
			this.type = 'day';
		},

		formatDayString(e) {
			return this.weekdaysStrings[e.weekday];
		},
		getEventColor(event) {
			return event.color;
		},
		setToday() {
			this.importTimetable.focus = '';
		},
		prev() {
			this.$refs.calendar.prev();
		},
		next() {
			this.$refs.calendar.next();
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
			let courses =
				this.selectedTab === 0
					? this.importTimetable.scheduledCourses
					: this.exportTimetable.scheduledCourses;

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
			if (this.selectedTab === 0) this.importTimetable.events = events;
			else this.exportTimetable.events = events;
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
				const modifiedEndTime = this.endTimeMapper[e];
				let startEvent = `${date.toISOString().substr(0, 10)} ${s}`;
				let endEvent = `${date.toISOString().substr(0, 10)} ${modifiedEndTime}`;
				let instructorsList = ``;
				currSlot.instructors.forEach((it) => (instructorsList += `<li>${it}</li>`));
				let evData = {
					start: startEvent,
					end: endEvent,
					color: this.colorsMapper[type],
					name: `${course.courseCode} - ${currSlot.section}`,
					title: `${course.courseName}`,
					courseID: course.courseCode,
					manualTimeSummary: `${s.split(':')[0]} - ${e}`,
					details: `
						<div class='black--text'>
							<h4>${this.typesMapper[type]} Section - ${currSlot.section}</h4>
							<h4>Instructor(s)</h4>
							<ul>
								${instructorsList}
							</ul>
							<h4>Comprehensive Exam: ${moment(course.comprehensiveExamDate).format('Do MMM,  h:mm A')}</h4>
							<h4>Course IC: ${course.IC}</h4>
						</div>
					`,
				};
				slots.push(evData);
			}
			return slots;
		},

		showEvent({ nativeEvent, event }) {
			if (this.selectedTab === 0) {
				const open = () => {
					this.importTimetable.selectedEvent = event;
					this.importTimetable.selectedElement = nativeEvent.target;
					setTimeout(() => {
						this.importTimetable.selectedOpen = true;
					}, 10);
				};
				if (this.importTimetable.selectedOpen) {
					this.importTimetable.selectedOpen = false;
					setTimeout(open, 10);
				} else {
					open();
				}
			} else {
				const open = () => {
					this.exportTimetable.selectedEvent = event;
					this.exportTimetable.selectedElement = nativeEvent.target;
					setTimeout(() => {
						this.exportTimetable.selectedOpen = true;
					}, 10);
				};
				if (this.exportTimetable.selectedOpen) {
					this.exportTimetable.selectedOpen = false;
					setTimeout(open, 10);
				} else {
					open();
				}
			}

			nativeEvent.stopPropagation();
		},

		async takeScreenshot() {
			const canvas = await html2canvas(document.getElementById('my-imported-timetable-box'));
			this.$refs.myScreenshotViewer.showDialog(canvas.toDataURL('image/png'));
		},

		async saveScreenshot({ choosenOption, imageData }) {
			if (choosenOption) {
				this.downloadURI(imageData, 'timtable-schedule.png');
			}
			this.$refs.myScreenshotViewer.hideDialog();
		},

		downloadURI(uri, name) {
			var link = document.createElement('a');
			link.download = name;
			link.href = uri;
			link.click();
		},

		async exportMyTimetable() {
			try {
				if (this.exportTimetable?.scheduledCourses?.length > 0) {
					this.exportingMyTimetable = true;
					const { shareID } = await this.$store.dispatch('sendRequest', {
						method: 'POST',
						url: `timetable/export`,
						requestBody: this.exportTimetable.scheduledCourses,
					});
					this.exportTimetable.shareID = shareID;
					this.exportingMyTimetable = false;
					this.myTimetableExported = true;
				} else {
					this.$store.commit('ADD_NOTIFICATION', {
						message: _.upperCase('please create a timetable to export'),
						type: 'warning',
					});
				}
			} catch (e) {
				console.log(e);
			}
		},

		copyExportedLink() {
			if (this.exportTimetable.shareID && this.exportTimetable.shareID.length === 32) {
				if (navigator.clipboard) {
					const shareLink =
						window.location.origin + '/share-timetable?share_id=' + this.exportTimetable.shareID;
					navigator.clipboard.writeText(shareLink);
				} else {
					let textToCopy = this.$refs.myTimetableExportedID.$el.querySelector('input');
					textToCopy.select();
					document.execCommand('copy');
				}
				this.$store.commit('ADD_NOTIFICATION', {
					message: _.upperCase('copied to clipboard'),
					type: 'success',
				});
			}
		},
	},
};
</script>
<style>
.import-container {
	min-height: 75vh;
}
/* .my-import-timetable-calendar .v-calendar-daily__interval {
	height: 60px !important;
}
.my-import-timetable-calendar .v-calendar-daily__day-interval {
	height: 60px !important;
} */
</style>
