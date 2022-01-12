<template>
	<div>
		<div v-if="!isGenerated">
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
				<div style="margin: auto" v-else-if="courseDetailsArr.length === 0">
					<v-img contain src="@/assets/empty.png"></v-img>
					<p class="text-overline text-center">Your Course Collection is Empty</p>
				</div>
				<div class="my-container" v-else>
					<v-card
						v-for="currentCourse in courseDetailsArr"
						:key="currentCourse.courseCode"
						class="my-generate-course-card"
					>
						<v-tooltip right>
							<template v-slot:activator="{ on, attrs }">
								<v-icon
									class="my-generate-remove-icon"
									color="error"
									v-bind="attrs"
									v-on="on"
									@click="removeCourseLocally(currentCourse.courseCode)"
								>
									mdi-delete-outline
								</v-icon>
							</template>
							<span>Remove Course</span>
						</v-tooltip>
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
										<div v-else>
											<div class="preference-radio">
												<v-radio-group v-model="currentCourse[`${item}_preference`]">
													<v-radio
														label="I definitely want these sections"
														value="PREFERRED"
													></v-radio>
													<v-radio
														label="I definitely don't want these sections"
														value="UNPREFERRED"
													></v-radio>
												</v-radio-group>
											</div>
											<div class="section-selection">
												<v-combobox
													:label="`Choose ${sectionTypePretty(item)} section`"
													multiple
													filled
													dense
													flat
													small-chips
													:items="parseSectionsList(currentCourse[item])"
													clearable
													v-model="currentCourse.preferenceSelection[item]"
													:deletable-chips="true"
												></v-combobox>
											</div>
											<div id="generate-tt-section-list">
												<v-expansion-panels focusable>
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
											</div>
										</div>
									</v-container>
								</v-tab-item>
							</div>
						</v-tabs-items>
					</v-card>
				</div>
			</div>
			<div class="submit-btn text-center mb-5 mt-3" v-if="!loading && courseDetailsArr.length > 0">
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
		<div v-show="isGenerated">
			<v-container fluid class="px-8 pb-5">
				<v-row justify="center">
					<v-col cols="11">
						<v-row>
							<v-col>
								<v-sheet height="64">
									<v-toolbar flat>
										<v-toolbar-title v-if="$refs.calendar" v-show="generatedTimetables.length > 0">
											<small> Total Units: {{ totalUnitsForGenerateTT }} </small>
											<small class="ml-2">
												( Total timetables generated: {{ generatedTimetables.length }} )
											</small>
											<small class="ml-2 primary--text">
												[ Timetable {{ currentTimetableIndex }} ]
											</small>
										</v-toolbar-title>
										<v-spacer></v-spacer>
										<v-btn
											outlined
											tile
											color="primary"
											depressed
											class="mr-5"
											@click="takeScreenshot"
											v-show="generatedTimetables.length > 0"
										>
											<v-icon left>mdi-camera</v-icon>
											save timetable
										</v-btn>
										<v-btn
											outlined
											tile
											color="success"
											depressed
											class="mr-2"
											@click="exportCurrentTimetable"
											v-show="generatedTimetables.length > 0"
										>
											<v-icon left>mdi-share-outline</v-icon>
											export timetable
										</v-btn>
										<v-btn
											outlined
											tile
											color="warning"
											depressed
											class="ml-3"
											@click="goToInitialState"
										>
											<v-icon left>mdi-cog-refresh-outline</v-icon>
											Generate Again
										</v-btn>
									</v-toolbar>
								</v-sheet>
								<div class="my-404-generated mt-5" v-if="generatedTimetables.length === 0">
									<v-img
										height="450"
										width="450"
										style="margin: auto"
										src="@/assets/404-generated.svg"
									></v-img>
									<p class="text-center body-1 mt-3">
										{{
											'We did not found any timetable based on the given preferences !!'.toUpperCase()
										}}
									</p>
								</div>
								<v-sheet id="my-main-timetable-box" v-show="generatedTimetables.length > 0">
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
										:interval-count="11"
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
						<div class="pagination-btn mt-5" v-if="generatedTimetables.length > 0">
							<v-btn
								tile
								color="info"
								depressed
								@click="paginationClicked('decrease')"
								:disabled="currentTimetableIndex === 1"
							>
								<v-icon left>mdi-arrow-left-drop-circle</v-icon>
								Prev Timetable
							</v-btn>

							<v-btn
								tile
								color="info"
								depressed
								class="ml-5"
								@click="paginationClicked('increase')"
								:disabled="currentTimetableIndex === generatedTimetables.length"
							>
								Next Timetable
								<v-icon right>mdi-arrow-right-drop-circle</v-icon>
							</v-btn>
						</div>
					</v-col>
				</v-row>
			</v-container>
		</div>
		<my-show-screenshot ref="myScreenshotViewer" @confirmQuery="saveScreenshot" />
		<my-generate-pdf-dialog ref="confirmationDialogForPDF" @confirmQuery="confirmationSubmit" />

		<v-overlay :value="exportingCurrentTimetable">
			<v-progress-circular indeterminate size="64"></v-progress-circular>
		</v-overlay>
		<v-snackbar v-model="showExportedShareIdAlert" color="success">
			{{ currentExportedId }}
			<template v-slot:action="{ attrs }">
				<v-btn v-bind="attrs" icon @click="copyExportedLink">
					<v-icon>mdi-content-copy</v-icon>
				</v-btn>
			</template>
		</v-snackbar>
		<v-fab-transition>
			<v-tooltip left>
				<template v-slot:activator="{ on, attrs }">
					<v-btn
						@click="openDialogForDownloadPDF"
						v-show="isGenerated && generatedTimetables.length > 0"
						color="info"
						fixed
						bottom
						right
						fab
						v-bind="attrs"
						v-on="on"
						:loading="pdfDownloading"
						:disabled="pdfDownloading"
					>
						<v-icon>mdi-download-outline</v-icon>
					</v-btn>
				</template>
				<span>Download as PDF</span>
			</v-tooltip>
		</v-fab-transition>
	</div>
</template>

<script>
import _ from 'lodash';
import html2canvas from 'html2canvas';
import moment from 'moment';
import { mapGetters } from 'vuex';
import ShowScreenshots from '@/components/layouts/ShowScreenshot.vue';
import GeneratePageDownloadConfirm from '@/components/layouts/GeneratePageDownloadConfirm.vue';

export default {
	name: 'generate-timetable',
	components: {
		'my-show-screenshot': ShowScreenshots,
		'my-generate-pdf-dialog': GeneratePageDownloadConfirm,
	},
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
		isGenerated: false,
		generatedTimetables: [],
		currentTimetableIndex: 1,
		preferenceData: [],
		preferenceSelection: [],
		// For Timetable Calender
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
		exportingCurrentTimetable: false,
		showExportedShareIdAlert: false,
		currentExportedId: '',
		pdfDownloading: false,
		totalUnitsForGenerateTT: 0,
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

		sectionTypePretty: () => (type) => {
			return _.capitalize(type).substr(0, type.length - 1);
		},

		parseSectionsList: () => (list) => {
			const parsedList = list.map((sec) => {
				let desiredString = ``;
				sec.timings.forEach((timing) => (desiredString += `${timing.dayCode}, `));
				return `${sec.section} - ${sec.instructors[0]} - (${desiredString.substring(
					0,
					desiredString.length - 2
				)})`;
			});
			return parsedList;
		},
	},
	methods: {
		openDialogForDownloadPDF() {
			this.$refs.confirmationDialogForPDF.showDialog();
		},
		confirmationSubmit({ chosenOption }) {
			if (chosenOption) {
				this.downloadPDF();
			}
			this.$refs.confirmationDialogForPDF.hideDialog();
		},
		removeCourseLocally(courseCode) {
			this.courseDetailsArr = this.courseDetailsArr.filter((it) => it.courseCode !== courseCode);
		},
		async downloadPDF() {
			try {
				this.pdfDownloading = true;
				const vm = this;
				const preference_data = this.courseDetailsArr.map((it) => {
					let lec_codes = it.preferenceSelection.lectures.map((ll) =>
						vm.reverseParseSectionString(ll, it, 'lectures')
					);
					let tut_codes = it.preferenceSelection.tutorials.map((ll) =>
						vm.reverseParseSectionString(ll, it, 'tutorials')
					);
					let lab_codes = it.preferenceSelection.labs.map((ll) =>
						vm.reverseParseSectionString(ll, it, 'labs')
					);
					let lec_pref = it.lectures_preference === 'PREFERRED';
					let tut_pref = it.tutorials_preference === 'PREFERRED';
					let lab_pref = it.labs_preference === 'PREFERRED';

					return {
						[it.courseCode]: {
							PREFERRED: {
								LECTURES: lec_pref ? lec_codes : [],
								TUTORIALS: tut_pref ? tut_codes : [],
								LABS: lab_pref ? lab_codes : [],
							},
							UNPREFERRED: {
								LECTURES: !lec_pref ? lec_codes : [],
								TUTORIALS: !tut_pref ? tut_codes : [],
								LABS: !lab_pref ? lab_codes : [],
							},
						},
					};
				});

				const resp = await fetch('/api/v1/pdf/generate-timetable', {
					headers: {
						Accept: 'application/json',
						'Content-Type': 'application/json',
					},
					method: 'POST',
					body: JSON.stringify(preference_data),
				});
				const myFile = await resp.blob();
				this.saveFileToLocal(myFile);
				this.pdfDownloading = false;
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
			a.download = `timetable-xyz.pdf`;
			a.click();
			window.URL.revokeObjectURL(url);
		},

		async fetchCourseDetails() {
			this.loading = true;
			try {
				await this.$store.dispatch('getUserCourses');
				const course_codes = this.getUserCoursesWithTag.map((it) => it.courseCode).join(',');
				const resp = await this.$store.dispatch('sendRequest', {
					method: 'GET',
					url: `courses/generate/course_details?course_codes=${course_codes}`,
				});
				this.courseDetailsArr = resp.map((item) => {
					return {
						...item,
						tab: null,
						lectures_preference: 'PREFERRED',
						tutorials_preference: 'PREFERRED',
						labs_preference: 'PREFERRED',
						preferenceSelection: {
							lectures: [],
							tutorials: [],
							labs: [],
						},
					};
				});
				this.preferenceData = this.courseDetailsArr.map((it) => {
					return {
						[it.courseCode]: {
							PREFERRED: { LECTURES: [], TUTORIALS: [], LABS: [] },
							UNPREFERRED: { LECTURES: [], TUTORIALS: [], LABS: [] },
						},
					};
				});
				this.loading = false;
			} catch (err) {
				console.error(err);
			}
		},

		async goToInitialState() {
			try {
				this.loading = true;
				this.generating = false;
				this.isGenerated = false;
				this.currentTimetableIndex = 1;
				this.generatedTimetables = [];
				this.events = [];
				await this.fetchCourseDetails();
			} catch (e) {
				console.log(e);
			}
		},

		reverseParseSectionString(str, course, sectionType) {
			let section_code = str.split(' - ')[0];
			const isNew = course[sectionType].find((it) => it.section === section_code).newSection;
			if (isNew) return section_code + 'N';
			return section_code;
		},

		async generateTimetable() {
			this.generating = true;
			try {
				const vm = this;
				const preference_data = this.courseDetailsArr.map((it) => {
					let lec_codes = it.preferenceSelection.lectures.map((ll) =>
						vm.reverseParseSectionString(ll, it, 'lectures')
					);
					let tut_codes = it.preferenceSelection.tutorials.map((ll) =>
						vm.reverseParseSectionString(ll, it, 'tutorials')
					);
					let lab_codes = it.preferenceSelection.labs.map((ll) =>
						vm.reverseParseSectionString(ll, it, 'labs')
					);
					let lec_pref = it.lectures_preference === 'PREFERRED';
					let tut_pref = it.tutorials_preference === 'PREFERRED';
					let lab_pref = it.labs_preference === 'PREFERRED';

					return {
						[it.courseCode]: {
							PREFERRED: {
								LECTURES: lec_pref ? lec_codes : [],
								TUTORIALS: tut_pref ? tut_codes : [],
								LABS: lab_pref ? lab_codes : [],
							},
							UNPREFERRED: {
								LECTURES: !lec_pref ? lec_codes : [],
								TUTORIALS: !tut_pref ? tut_codes : [],
								LABS: !lab_pref ? lab_codes : [],
							},
						},
					};
				});

				const { scheduledCourses } = await this.$store.dispatch('sendRequest', {
					method: 'POST',
					url: `timetable/generate-timetable`,
					requestBody: preference_data,
				});
				const courseDetails = this.courseDetailsArr;
				this.generatedTimetables = scheduledCourses.map((tt) => {
					return tt.map((sb) => {
						let full_course = courseDetails.find((it) => it.courseCode === sb.courseCode);
						return {
							...sb,
							IC: full_course.IC,
							comprehensiveExamDate: full_course.comprehensiveExamDate,
							courseName: full_course.courseName,
							courseNo: full_course.courseNo,
						};
					});
				});
				this.isGenerated = true;
				this.generating = false;
				const [f_date, l_date] = this.getWeekDaysBasedOnToday();
				this.updateRange({ start: f_date, end: l_date });

				// total units
				let unitsCount = 0;
				this.courseDetailsArr.forEach((cc) => (unitsCount += cc.units));
				this.totalUnitsForGenerateTT = unitsCount;
			} catch (err) {
				console.error(err);
			}
		},

		async exportCurrentTimetable() {
			this.exportingCurrentTimetable = true;
			try {
				let current_scheduled_courses = this.isGenerated
					? this.generatedTimetables[this.currentTimetableIndex - 1]
					: [];
				const { shareID } = await this.$store.dispatch('sendRequest', {
					method: 'POST',
					url: `timetable/export`,
					requestBody: current_scheduled_courses,
				});
				this.currentExportedId = shareID;
				this.showExportedShareIdAlert = true;
				this.exportingCurrentTimetable = false;
			} catch (e) {
				console.log(e);
			}
		},

		copyExportedLink() {
			if (this.currentExportedId && this.currentExportedId.length === 32) {
				if (navigator.clipboard) {
					const shareLink =
						window.location.origin + '/share-timetable?share_id=' + this.currentExportedId;
					navigator.clipboard.writeText(shareLink);
					this.showExportedShareIdAlert = false;
				} else {
					alert("Kindly copy the code manually. Your browser doesn't support click to copy !!");
				}
				this.$store.commit('ADD_NOTIFICATION', {
					message: _.upperCase('copied to clipboard'),
					type: 'success',
				});
			}
		},

		paginationClicked(direction) {
			if (direction === 'increase') {
				this.currentTimetableIndex = this.currentTimetableIndex + 1;
			} else if (direction === 'decrease') {
				this.currentTimetableIndex = this.currentTimetableIndex - 1;
			}
			this.setUpPagination();
		},

		setUpPagination() {
			const [f_date, l_date] = this.getWeekDaysBasedOnToday();
			this.updateRange({ start: f_date, end: l_date });
		},

		formatDayString(e) {
			return this.weekdaysStrings[e.weekday];
		},
		getEventColor(event) {
			return event.color;
		},

		getWeekDaysBasedOnToday() {
			const today = new Date();
			const today_index = today.getDay();
			let first_day = new Date(today);
			let last_day = new Date(today);

			first_day.setDate(first_day.getDate() - today_index);
			last_day.setDate(first_day.getDate() + 6);

			return [
				{ date: moment(first_day).format('YYYY-MM-DD') },
				{ date: moment(last_day).format('YYYY-MM-DD') },
			];
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
			let courses = this.isGenerated
				? this.generatedTimetables[this.currentTimetableIndex - 1]
				: [];

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
.new-section-tag {
	position: absolute;
	right: 5px;
	top: 5px;
}
.pagination-btn {
	display: flex;
	justify-content: center;
	align-items: center;
}
#timings-container {
	max-height: 50vh;
	overflow-y: scroll;
}
#timings-container::-webkit-scrollbar {
	width: 0;
}
#generate-tt-section-list {
	max-height: 30vh;
	overflow-y: scroll;
}
#generate-tt-section-list::-webkit-scrollbar {
	width: 0;
}
.my-404-generated {
	display: flex;
	flex-direction: column;
}
.my-generate-remove-icon {
	position: absolute;
	right: 3%;
	top: 3%;
	cursor: pointer;
}
</style>
