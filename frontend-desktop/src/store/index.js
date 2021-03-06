import Vue from 'vue';
import Vuex from 'vuex';
import createConfig from './helpers/api-auth';
import localDB from './api/localDB';
import moment from 'moment';
import _ from 'lodash';

Vue.use(Vuex);

export default new Vuex.Store({
	state: {
		notifications: [],
		timetableSchedule: null,
		timetableSaveStatus: true,
		scheduledCourses: [],
		sectionTypes: ['lectures', 'tutorials', 'labs'],
		userCourses: [],
		sectionTypeMapping: {
			L: 'lectures',
			T: 'tutorials',
			P: 'labs',
		},
		weekdayMapping: {
			M: 0,
			T: 1,
			W: 2,
			Th: 3,
			F: 4,
			S: 5,
		},
		timeMapping: {
			'08:00': 0,
			'09:00': 1,
			'10:00': 2,
			'11:00': 3,
			'12:00': 4,
			'13:00': 5,
			'14:00': 6,
			'15:00': 7,
			'16:00': 8,
			'17:00': 9,
			'18:00': 10,
			'19:00': 11,
			'20:00': 12,
		},
	},

	getters: {
		notifications(state) {
			return state.notifications;
		},
		getSavingStatus(state) {
			return state.timetableSaveStatus;
		},
		getScheduledCourses(state) {
			return state.scheduledCourses;
		},
		getCurrentCourseScheduledSections: (state) => (code) => {
			return state.scheduledCourses.find((sb) => sb.courseCode === code);
		},
		getSectionType: (state) => (sectionID) => {
			return state.sectionTypeMapping[sectionID[0]];
		},
		getUserCoursesWithTag: (state) => {
			const courseCodes = state.scheduledCourses.map((sb) => {
				const sectionTypes = state.sectionTypes;
				let fullfilled = sectionTypes.every((sectionType) => {
					let keyword = sectionType + 'Section';
					if (
						(_.get(sb, sectionType) > 0 && _.has(sb, keyword) && _.get(sb, keyword)) ||
						_.get(sb, sectionType) === 0
					)
						return true;
					return false;
				});
				if (fullfilled) return sb.courseCode;
				else return undefined;
			});
			return state.userCourses.map((sb) => {
				if (courseCodes.includes(sb.courseCode)) {
					return { ...sb, scheduled: true };
				} else {
					return { ...sb, scheduled: false };
				}
			});
		},
	},

	mutations: {
		ADD_NOTIFICATION(state, notification) {
			state.notifications = [...state.notifications, notification];
		},
		SET_TIMETABLE_SCHEDULE(state, dataset) {
			state.timetableSchedule = dataset;
		},
		ADD_TO_SCHEDULE(state, { indexes, course, section, sectionType }) {
			indexes.forEach((slotIndex) => {
				for (let i = 0; i < slotIndex[2]; i++) {
					state.timetableSchedule[slotIndex[0]][slotIndex[1] + i] = {
						...course,
						[`${sectionType}Section`]: section,
						indexSection: `${sectionType.substring(0, sectionType.length - 1)} - ${
							section.section
						}`.toUpperCase(),
					};
				}
			});
		},

		REMOVE_FROM_SCHEDULE(state, indexes) {
			indexes.forEach((slotIndex) => {
				for (let i = 0; i < slotIndex[2]; i++) {
					state.timetableSchedule[slotIndex[0]][slotIndex[1] + i] = null;
				}
			});
		},

		ADD_COURSE_FOR_TIMETABLE(state, { course, section, sectionType }) {
			const existingCourseIndex = state.scheduledCourses.findIndex(
				(c) => c.courseCode === course.courseCode
			);

			if (existingCourseIndex !== -1) {
				state.scheduledCourses = state.scheduledCourses.map((c) => {
					if (course.courseCode === c.courseCode) {
						return { ...c, [`${sectionType}Section`]: section };
					} else {
						return c;
					}
				});
			} else {
				state.scheduledCourses = [
					...state.scheduledCourses,
					{ ...course, [`${sectionType}Section`]: section },
				];
			}
		},
		REMOVE_COURSE_SECTION_FROM_SCHEDULE(state, { course, sectionType }) {
			const existingCourseIndex = state.scheduledCourses.findIndex(
				(c) => c.courseCode === course.courseCode
			);

			if (existingCourseIndex !== -1) {
				state.scheduledCourses = state.scheduledCourses.map((c) => {
					if (course.courseCode === c.courseCode) {
						return { ...c, [`${sectionType}Section`]: undefined };
					} else {
						return c;
					}
				});
			}
		},

		CHANGE_SAVE_STATUS(state, current_status) {
			if (current_status === false) {
				window.onbeforeunload = function () {
					return 'Are you sure you want to leave?';
				};
			} else {
				window.onbeforeunload = null;
			}
			state.timetableSaveStatus = current_status;
		},
		SET_SCHEDULED_COURSES(state, courses) {
			state.scheduledCourses = courses;
		},
		REMOVE_ENTIRE_COURSE_FROM_SCHEDULE(state, course) {
			state.scheduledCourses = state.scheduledCourses.filter(
				(sb) => sb.courseCode !== course.courseCode
			);
		},
		SET_USER_COURSES(state, courses) {
			state.userCourses = courses;
		},
		REMOVE_USER_COURSE(state, courseCode) {
			state.userCourses = state.userCourses.filter((sb) => sb.courseCode !== courseCode);
		},
	},

	actions: {
		/**
		 *
		 * Remove entire course from schedule (IndexedDB Clear)
		 *
		 */
		async removeOldData() {
			try {
				await localDB.deleteOldDbs();
			} catch (e) {
				console.log(e);
			}
		},

		/**
		 *
		 * @param {*} context
		 *
		 * Get all courses from IndexedDB and setup a 2D Array for the timetable
		 *
		 */
		async initializateSchedule(context) {
			const scheduledCourses = await localDB.readData('SCHEDULED_COURSES');

			let weekdayArray = new Array(7);
			for (let i = 0; i < 7; i++) {
				weekdayArray[i] = new Array(12);
			}

			context.commit('SET_TIMETABLE_SCHEDULE', weekdayArray);
			context.commit('SET_SCHEDULED_COURSES', scheduledCourses);

			for (let i = 0; i < scheduledCourses.length; i++) {
				const sectionTypes = context.state.sectionTypes;

				for (let j = 0; j < sectionTypes.length; j++) {
					let requiredKey = sectionTypes[j] + 'Section';
					if (_.has(scheduledCourses[i], requiredKey) && _.get(scheduledCourses[i], requiredKey)) {
						let indexes = await context.dispatch(
							'parseSectionTimings',
							scheduledCourses[i][requiredKey].timings
						);

						context.commit('ADD_TO_SCHEDULE', {
							indexes,
							course: scheduledCourses[i],
							section: scheduledCourses[i][requiredKey],
							sectionType: sectionTypes[j],
						});
					}
				}
			}
		},

		/**
		 *
		 * @returns indexedDB Data Scheduled Courses
		 *
		 */
		async getMyScheduledCourses() {
			try {
				return await localDB.readData('SCHEDULED_COURSES');
			} catch (error) {
				console.log(error);
			}
		},

		/**
		 *
		 * @param {*} context
		 * @param {*} param1
		 * @returns
		 *
		 * API Requests to get all courses from the server
		 *
		 */
		async sendRequest(context, { url, method, requestBody }) {
			try {
				let res = await fetch(`/api/v1/${url}`, {
					method: method,
					...createConfig(),
					body: requestBody && JSON.stringify(requestBody),
				});
				return await res.json();
			} catch (e) {
				console.log(e);
			}
		},

		/**
		 *
		 * @param {*} context
		 * @param {*} course
		 * @returns
		 *
		 * Add a course to the user's courses Store (indexedDB)
		 *
		 */
		async addCourseToUserStore(context, course) {
			try {
				let { clashFound, clashedCourse } = await context.dispatch(
					'checkCompreExamClashes',
					course
				);

				if (clashFound) {
					context.commit('ADD_NOTIFICATION', {
						message: `COMPRE TIME CLASHES WITH ${clashedCourse.courseName} (${clashedCourse.courseCode})`,
						type: 'warning',
					});
					return false;
				}

				await localDB.writeData('USER_COURSES', course);
				context.commit('ADD_NOTIFICATION', {
					message: `${course.courseName} (${course.courseCode}) ADDED SUCCESSFULLY`,
					type: 'success',
				});
				return true;
			} catch (e) {
				console.log(e);
			}
		},

		/**
		 *
		 * @param {*} context
		 * @param {*} course
		 *
		 * Comprehensive Exam Clash Check
		 *
		 */
		async checkCompreExamClashes(context, newCourse) {
			try {
				const userCourses = await localDB.readData('USER_COURSES');
				let clashedCourse;

				let clashFound = userCourses.some((course) => {
					let currentCourseCompre = moment(course.comprehensiveExamDate).format('M:D:Y[-]hh:mm');
					let newCourseCompre = moment(newCourse.comprehensiveExamDate).format('M:D:Y[-]hh:mm');
					if (newCourseCompre === 'Invalid date') return false;

					if (currentCourseCompre === newCourseCompre) clashedCourse = course;
					return currentCourseCompre === newCourseCompre;
				});

				return { clashFound, clashedCourse };
			} catch (e) {
				console.log(e);
			}
		},

		/**
		 *
		 * @param {*} context
		 * @param {*} results
		 * @returns
		 *
		 * Filter Search Results based on already added courses
		 *
		 */
		async filterSearchResults(context, results) {
			try {
				const userCourses = await localDB.readData('USER_COURSES');
				const userCoursesCodes = userCourses.map((course) => course.courseCode);
				return results.map((course) => {
					if (userCoursesCodes.includes(course.courseCode)) return { ...course, added: true };
					else return course;
				});
			} catch (e) {
				console.log(e);
			}
		},

		/**
		 *
		 * @param {*} context
		 *
		 *  get added courses from indexedDB (Scheduled and not-scheduled)
		 */
		async getUserCourses(context) {
			try {
				const courses = await localDB.readData('USER_COURSES');
				context.commit('SET_USER_COURSES', courses);
			} catch (e) {
				console.log(e);
			}
		},

		/**
		 *
		 * @param {*} context
		 * @param {*} course
		 *
		 * Remove a course from the user's courses Store (indexedDB)
		 *
		 */
		async removeCourseFromUserStore(context, course) {
			try {
				const courseScheduled = context.getters.getCurrentCourseScheduledSections(
					course.courseCode
				);

				if (courseScheduled) {
					const sectionTypes = context.state.sectionTypes;

					for (let j = 0; j < sectionTypes.length; j++) {
						let requiredKey = sectionTypes[j] + 'Section';
						if (_.has(courseScheduled, requiredKey)) {
							let indexes = await context.dispatch(
								'parseSectionTimings',
								courseScheduled[requiredKey].timings
							);
							context.commit('REMOVE_FROM_SCHEDULE', indexes);
						}
					}
				}

				await localDB.removeItemFromStore('USER_COURSES', course.courseCode);
				await localDB.removeItemFromStore('SCHEDULED_COURSES', course.courseCode);

				context.commit('REMOVE_ENTIRE_COURSE_FROM_SCHEDULE', course);
				context.commit('REMOVE_USER_COURSE', course.courseCode);
				context.commit('ADD_NOTIFICATION', {
					message: `${course.courseName} (${course.courseCode}) REMOVED`,
					type: 'info',
				});
			} catch (e) {
				console.log(e);
			}
		},

		/**
		 *
		 * @param {*} context
		 * @param {*} param1
		 * @returns
		 *
		 * Add any course section to schedule
		 */
		async addSectionToSchedule(context, { sectionType, section, course, oldSection = null }) {
			try {
				const indexes = await context.dispatch('parseSectionTimings', section.timings);
				const { clashFound, clashedCourse } = await context.dispatch('checkSlotClashes', {
					indexes,
					course,
					sectionType,
					oldSection,
				});
				// console.log(checkLunchHourAvailable);
				const isLunchHourAvailable = await context.dispatch('checkLunchHourAvailable', indexes);
				if (!isLunchHourAvailable) {
					context.commit('ADD_NOTIFICATION', {
						message: 'PLEASE SELECT ANOTHER SECTION AS LUNCH HOUR IS NOT AVAILABLE',
						type: 'warning',
					});
					return { success: false };
				}

				if (!clashFound) {
					context.commit('ADD_TO_SCHEDULE', { indexes, course, section, sectionType });
					context.commit('ADD_COURSE_FOR_TIMETABLE', { course, section, sectionType });
					context.commit('CHANGE_SAVE_STATUS', false);
				} else {
					context.commit('ADD_NOTIFICATION', {
						message: `FOUND A CLASH WITH ${clashedCourse.courseName} (${clashedCourse.courseCode}) ${clashedCourse.indexSection}`,
						type: 'warning',
					});
					return { success: false };
				}
				return { success: true };
			} catch (error) {
				console.log('Add To Schedule Function', error);
			}
		},

		/**
		 *
		 * @param {*} context
		 * @param {*} param1
		 *
		 * Remove any course section from schedule
		 */
		async removeSectionFromSchedule(context, { sectionType, section, course }) {
			const indexes = await context.dispatch('parseSectionTimings', section.timings);
			context.commit('REMOVE_FROM_SCHEDULE', indexes);
			context.commit('REMOVE_COURSE_SECTION_FROM_SCHEDULE', { course, sectionType });
			context.commit('CHANGE_SAVE_STATUS', false);
		},

		async parseSectionTimings(context, timings) {
			// index -> [weekdayIndex, timeIndex, diff]
			let newIndexes = [];
			timings.forEach((timing) => {
				const [startTime, endTime] = timing.time.split(' - ');
				const weekdayIndex = context.state.weekdayMapping[timing.dayCode];
				const startTimeIndex = context.state.timeMapping[startTime];
				const timeDef = Number(endTime.split(':')[0]) - Number(startTime.split(':')[0]);

				newIndexes.push([weekdayIndex, startTimeIndex, timeDef + 1]);
			});
			return newIndexes;
		},

		async checkSlotClashes(
			context,
			{ indexes, oldSection = null, sectionType = null, course = null }
		) {
			try {
				// index -> [weekdayIndex, timeIndex, diff]
				let clashedCourse;
				let clashFound = false;

				for (let i = 0; i < indexes.length; i++) {
					for (let j = 0; j < indexes[i][2]; j++) {
						let slotCourse = context.state.timetableSchedule[indexes[i][0]][indexes[i][1] + j];

						if (slotCourse) {
							if (course && slotCourse.courseCode === course.courseCode && oldSection) {
								// Some Logic
							} else {
								clashedCourse = slotCourse;
								clashFound = true;
							}
						}
					}
				}

				if (!clashFound && oldSection) {
					await context.dispatch('removeSectionFromSchedule', {
						sectionType,
						section: oldSection,
						course,
					});
				}

				return { clashFound, clashedCourse };
			} catch (error) {
				console.log('Clash Function', error);
			}
		},

		/**
		 *
		 * @param {*} context
		 *
		 * Save the schedule to local indexedDB
		 */
		async saveTimetableSchedule(context) {
			try {
				await localDB.writeBulkData('SCHEDULED_COURSES', context.state.scheduledCourses);
				context.commit('CHANGE_SAVE_STATUS', true);
			} catch (e) {
				console.log(e);
			}
		},

		async checkLunchHourAvailable(context, newSectionTimings) {
			try {
				const currentTimetableSchedule = context.state.timetableSchedule;
				return newSectionTimings.every((timing) => {
					let currentDayTiming = currentTimetableSchedule[timing[0]];

					if ([2, 3, 4, 5].includes(timing[1])) {
						let slot1 = currentDayTiming[4];
						let slot2 = currentDayTiming[5];

						switch (timing[1]) {
							case 2:
								if (timing[2] === 3) slot1 = 'booked';
								break;
							case 3:
								if (timing[2] === 3) {
									slot1 = 'booked';
									slot2 = 'booked';
								}
								if (timing[2] === 2) slot1 = 'booked';
								break;
							case 4:
								if (timing[2] === 3 || timing[2] === 2) {
									slot1 = 'booked';
									slot2 = 'booked';
								}
								if (timing[2] === 1) slot1 = 'booked';
								break;
							case 5:
								if (timing[2] === 3 || timing[2] === 2 || timing[2] === 1) {
									slot2 = 'booked';
								}
								break;
							default:
								break;
						}

						if (slot1 && slot2) return false;
						else return true;
					} else return true;
				});
			} catch (e) {
				console.log(e);
			}
		},
	},
	modules: {},
});
