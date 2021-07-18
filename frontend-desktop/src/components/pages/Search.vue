<template>
	<div>
		<div class="mt-2">
			<v-form>
				<v-container>
					<v-row justify="center">
						<v-col cols="8">
							<v-text-field
								v-model="typedText"
								label="Search for Courses ..."
								type="text"
								:prepend-inner-icon="searchIcon"
								:clear-icon="clearIcon"
								:messages="hintText"
								@click:clear="clearTypedText"
								@focus="showHint"
								@blur="hideHint"
								solo
								dense
								clearable
							></v-text-field>
						</v-col>
					</v-row>
				</v-container>
			</v-form>
		</div>
		<div v-if="searching || !searchResults">
			<v-container>
				<v-row justify="center">
					<v-col v-for="n in 6" :key="n" cols="4">
						<v-skeleton-loader v-bind="attrs" type="article, actions"></v-skeleton-loader>
					</v-col>
				</v-row>
			</v-container>
		</div>
		<div v-else-if="!searching && searchResults.length === 0">
			<v-container>
				<v-row justify="center">
					<v-img contain max-height="450" max-width="450" src="@/assets/no-data.jpg"></v-img>
				</v-row>
			</v-container>
		</div>
		<div v-else>
			<div class="text-center">
				<v-container class="my-0 py-0">
					<v-row justify="center" align="center">
						<v-col cols="4">
							<div class="primary--text text-body-1">
								Total {{ pagination.totalCourses }} Courses Found
							</div>
						</v-col>
						<v-col cols="8">
							<v-container class="max-width my-0 py-0">
								<v-pagination
									v-model="pagination.page"
									class="mt-0 mb-2"
									:length="pagination.totalPages"
									:total-visible="9"
									@input="paginationClicked"
								></v-pagination>
							</v-container>
						</v-col>
					</v-row>
				</v-container>
			</div>
			<v-container>
				<v-row justify="center" class="mb-3">
					<v-col v-for="course in searchResults" :key="course._id" cols="4"
						><v-card class="mx-auto" max-width="400">
							<v-card-text class="mb-0 pb-0">
								<div class="text-subtitle-2 mb-1">
									<v-icon left color="black" small>
										mdi-bookmark-multiple
									</v-icon>
									<span>{{ course.courseCode }}</span>
								</div>
								<div class="text-subtitle-1 black--text font-weight-medium">
									{{ course.courseName }}
								</div>
							</v-card-text>

							<v-card-text class="pt-2 pb-1 text-body-1 black--text">
								<div>
									<span>Units:{{ ' ' }}</span>
									<span>{{ course.units }}</span>
								</div>
							</v-card-text>

							<v-card-text class="pt-0 pb-2 d-flex justify-space-between text-body-1 black--text">
								<div>
									<span>Tutorials:{{ ' ' }}</span>
									<span>{{ course.tutorials }}</span>
								</div>
								<div>
									<span>Lectures:{{ ' ' }}</span>
									<span>{{ course.lectures }}</span>
								</div>
								<div>
									<span>Labs:{{ ' ' }}</span>
									<span>{{ course.labs }}</span>
								</div>
							</v-card-text>

							<v-card-text class="pt-0 pb-1 text-body-1 black--text font-weight-medium">
								<div>
									<span>IC:{{ '  ' }}</span>
									<span>{{ course.IC }}</span>
								</div>
							</v-card-text>

							<v-card-actions>
								<v-row align="center" justify="end" class="px-2 pb-2">
									<v-btn class="ma-2" outlined color="primary" small>
										<v-icon left>mdi-plus</v-icon>
										Add Course
									</v-btn>
								</v-row>
							</v-card-actions>
						</v-card>
					</v-col>
				</v-row>
			</v-container>
		</div>
	</div>
</template>

<script>
// import _ from 'lodash';
export default {
	name: 'search-courses',
	data: () => ({
		typedText: '',
		searchIcon: 'mdi-magnify',
		clearIcon: 'mdi-close',
		hintText: '',
		searching: false,
		searchResults: null,
		attrs: {
			class: 'mb-1',
			boilerplate: false,
			elevation: 2,
		},
		pagination: {
			totalCourses: 0,
			page: 1,
			limit: 9,
			totalPages: 0,
		},
	}),
	methods: {
		clearTypedText() {
			this.typedText = '';
		},
		showHint() {
			this.hintText = 'Search by Course Name (eg. Digital Design) or Course Code (eg. EEE F221)';
		},
		hideHint() {
			this.hintText = '';
		},

		async fetchCourses(searchText = '', page = 1) {
			try {
				this.searching = true;
				const courses = await this.$store.dispatch('sendRequest', {
					method: 'GET',
					url: `courses?search=${searchText}&page=${page}`,
				});
				this.searching = false;
				this.searchResults = courses.data;
				this.pagination = courses.metadata;
			} catch (err) {
				console.error(err);
			}
		},

		async paginationClicked(currentPage) {
			await this.fetchCourses(this.typedText, currentPage);
		},
	},

	async mounted() {
		await this.fetchCourses();
	},

	watch: {
		typedText: function(newVal, oldVal) {
			if (newVal.trim().length >= 3) {
				this.fetchCourses(newVal);
			} else if (newVal.trim().length < oldVal.trim().length) {
				this.fetchCourses();
			}
		},
	},
};
</script>
<style></style>
