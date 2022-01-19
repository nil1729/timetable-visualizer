<template>
	<div>
		<v-container fluid class="px-8 pb-8">
			<v-row justify="center">
				<v-col cols="12">
					<v-sheet v-if="timetableLoading" class="pa-8">
						<v-skeleton-loader class="mx-auto" type="table"></v-skeleton-loader>
					</v-sheet>
					<v-row class="fill-height" v-else>
						<v-col>
							<v-sheet height="64">
								<v-toolbar flat>
									<v-btn outlined class="mr-4" color="grey darken-2" @click="setToday">
										Today
									</v-btn>
									<v-btn fab text small color="grey darken-2" @click="prev">
										<v-icon small> mdi-chevron-left </v-icon>
									</v-btn>
									<v-btn fab text small color="grey darken-2" @click="next">
										<v-icon small> mdi-chevron-right </v-icon>
									</v-btn>
									<v-toolbar-title v-if="$refs.calendar">
										<span class="text-subtile-1 primary--text"> Timetable Schedule </span>
										<span class="text-subtile-2 ml-2">{{ $refs.calendar.title }} </span>
									</v-toolbar-title>
									<v-spacer></v-spacer>
									<v-btn
										outlined
										tile
										color="success"
										depressed
										class="mr-5"
										@click="openModalForICS"
										:disabled="icsGeneration.isGenerating"
									>
										<v-icon left v-if="!icsGeneration.isGenerating">
											mdi-calendar-check-outline
										</v-icon>
										<v-icon left v-if="icsGeneration.generateType === 'download'">
											mdi-hammer-wrench
										</v-icon>
										<v-icon left v-if="icsGeneration.generateType === 'email'">
											mdi-email-send-outline
										</v-icon>
										{{
											!icsGeneration.isGenerating
												? 'add to calendar'
												: icsGeneration.generateType === 'download'
												? 'Generating ...'
												: 'Sending Email ...'
										}}
									</v-btn>
									<v-btn
										outlined
										tile
										color="primary"
										depressed
										class="mr-5"
										@click="takeScreenshot"
									>
										<v-icon left>mdi-camera</v-icon>
										save timetable
									</v-btn>
									<v-menu bottom right>
										<template v-slot:activator="{ on: menu, attrs }">
											<v-tooltip top>
												<template v-slot:activator="{ on: tooltip }">
													<v-btn
														outlined
														color="grey darken-2"
														v-bind="attrs"
														v-on="{ ...tooltip, ...menu }"
													>
														<span>{{ typeToLabel[type] }}</span>
														<v-icon right> mdi-menu-down </v-icon>
													</v-btn>
												</template>
												<span>Change Calender View</span>
											</v-tooltip>
										</template>
										<v-list>
											<v-list-item @click="type = 'day'">
												<v-list-item-title>Day</v-list-item-title>
											</v-list-item>
											<v-list-item @click="type = 'week'">
												<v-list-item-title>Week</v-list-item-title>
											</v-list-item>
											<v-list-item @click="type = 'month'">
												<v-list-item-title>Month</v-list-item-title>
											</v-list-item>
											<v-list-item @click="type = '4day'">
												<v-list-item-title>4 days</v-list-item-title>
											</v-list-item>
										</v-list>
									</v-menu>
								</v-toolbar>
							</v-sheet>
							<v-sheet id="my-main-timetable-box">
								<v-calendar
									class="my-view-calender"
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
									@click:more="viewDay"
									@click:date="viewDay"
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
												<v-icon color="black">mdi-pencil</v-icon>
											</v-btn>
											<v-toolbar-title class="pl-1">
												<span class="black--text">{{ selectedEvent.title }}</span>
											</v-toolbar-title>
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
		<my-show-screenshot ref="myScreenshotViewer" @confirmQuery="saveScreenshot" />
		<my-ics-modal ref="myModalForICS" @confirmQueryForICS="generateICS" />
	</div>
</template>

<script>
import _ from 'lodash';
import moment from 'moment';
import { mapGetters } from 'vuex';
import html2canvas from 'html2canvas';
import ShowScreenshots from '@/components/layouts/ShowScreenshot.vue';
import ModalForICS from '@/components/layouts/ModalForICS.vue';

export default {
	name: 'view-timetable',
	components: {
		'my-show-screenshot': ShowScreenshots,
		'my-ics-modal': ModalForICS,
	},
	data: () => ({
		timetableLoading: false,
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
		icsGeneration: {
			generateType: null,
			isGenerating: false,
		},
	}),

	computed: {
		...mapGetters(['getScheduledCourses']),
	},

	async mounted() {
		this.timetableLoading = true;
		this.$refs.calendar.checkChange();
		await this.$store.dispatch('initializateSchedule');
		await this.$store.dispatch('getUserCourses');
		this.timetableLoading = false;
	},

	methods: {
		editSchedule(courseID) {
			this.$router.push({
				name: 'EditTimetable',
				query: { ...this.$route.query, course_id: courseID },
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
			this.focus = '';
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
					courseID: course.courseCode,
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

		async takeScreenshot() {
			const canvas = await html2canvas(document.getElementById('my-main-timetable-box'));
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

		openModalForICS() {
			if (_.isArray(this.getScheduledCourses) && this.getScheduledCourses.length > 0) {
				this.$refs.myModalForICS.showDialog();
			} else {
				this.$store.commit('ADD_NOTIFICATION', {
					message: _.upperCase('please schedule your courses first'),
					type: 'warning',
				});
			}
		},

		async generateICS({ chosenOption, userEmail }) {
			try {
				this.icsGeneration.generateType = chosenOption;
				this.icsGeneration.isGenerating = true;
				this.$refs.myModalForICS.hideDialog();
				const myScheduledCourses = this.getScheduledCourses;
				const resp = await fetch('/api/v1/timetable/generate/ics-file', {
					headers: {
						Accept: 'application/json',
						'Content-Type': 'application/json',
					},
					method: 'POST',
					body: JSON.stringify({
						scheduledCourses: myScheduledCourses,
						userChoice: chosenOption,
						userEmail,
					}),
				});
				if (chosenOption === 'download') {
					const myFile = await resp.blob();
					this.saveFileToLocal(myFile);
				} else {
					const data = await resp.json();
					this.$store.commit('ADD_NOTIFICATION', {
						message: _.upperCase(data.message),
						type: 'success',
					});
				}
				this.icsGeneration.generateType = null;
				this.icsGeneration.isGenerating = false;
			} catch (e) {
				console.log(e);
			}
		},

		async saveFileToLocal(fileObj) {
			var a = document.createElement('a');
			document.body.appendChild(a);
			a.style = 'display: none';
			const url = window.URL.createObjectURL(fileObj);
			a.href = url;
			a.download = `timetable-schedule.ics`;
			a.click();
			window.URL.revokeObjectURL(url);
		},
	},
};
</script>
<style scoped></style>
