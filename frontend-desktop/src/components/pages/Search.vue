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
            <v-skeleton-loader
              v-bind="skeletonAttrs"
              type="article, actions"
            ></v-skeleton-loader>
          </v-col>
        </v-row>
      </v-container>
    </div>
    <div v-else-if="!searching && searchResults.length === 0">
      <v-container>
        <v-row justify="center">
          <v-img
            contain
            max-height="450"
            max-width="450"
            src="@/assets/no-data.jpg"
          ></v-img>
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
                <br />
                <small class="warning--text"
                  >Last Updated on: January 14<sup>th</sup>, 2022</small
                >
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
          <v-col
            v-for="course in searchResults"
            :key="course.courseCode"
            cols="4"
            ><v-card class="mx-auto" max-width="400">
              <v-card-text class="mb-0 pb-0">
                <div class="text-subtitle-2 mb-1 primary--text">
                  <v-icon left color="primary" small>
                    mdi-bookmark-multiple
                  </v-icon>
                  <span>{{ course.courseCode }}</span>
                </div>
                <div class="text-subtitle-1 font-weight-medium">
                  {{ course.courseName }}
                </div>
              </v-card-text>

              <v-card-text
                class="pt-1 pb-2 d-flex justify-space-between text-body-2"
              >
                <div>
                  <span>Units:{{ " " }}</span>
                  <span>{{ course.units }}</span>
                </div>
                <div>
                  <span>Tutorials:{{ " " }}</span>
                  <span>{{ course.tutorials }}</span>
                </div>
                <div>
                  <span>Lectures:{{ " " }}</span>
                  <span>{{ course.lectures }}</span>
                </div>
                <div>
                  <span>Labs:{{ " " }}</span>
                  <span>{{ course.labs }}</span>
                </div>
              </v-card-text>

              <v-card-actions>
                <v-row align="center" justify="end" class="px-2 pb-2">
                  <v-btn
                    class="ma-2"
                    :class="{ 'disabled-btn': course.added }"
                    :color="course.added ? 'success' : 'primary'"
                    small
                    depressed
                    @click="addCourse(course.courseCode)"
                    :tile="course.added"
                    :outlined="!course.added"
                  >
                    <v-icon left v-if="course.added">mdi-marker-check</v-icon>
                    <v-icon left v-else>mdi-plus</v-icon>
                    {{ course.added ? "course added" : "add course" }}
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
import _ from "lodash";
export default {
  name: "search-courses",
  data: () => ({
    typedText: "",
    searchIcon: "mdi-magnify",
    clearIcon: "mdi-close",
    hintText: "",
    searching: false,
    searchResults: null,
    skeletonAttrs: {
      class: "mb-1",
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
    showHint() {
      this.hintText =
        "Search by Course Name (eg. Digital Design) or Course Code (eg. EEE F221)";
    },
    hideHint() {
      this.hintText = "";
    },

    async fetchCourses(searchText = "", page = 1) {
      try {
        this.searching = true;
        const courses = await this.$store.dispatch("sendRequest", {
          method: "GET",
          url: `courses?search=${searchText}&page=${page}`,
        });
        this.searchResults = await this.$store.dispatch(
          "filterSearchResults",
          courses.data
        );
        this.pagination = courses.metadata;
        this.searching = false;
      } catch (err) {
        console.error(err);
      }
    },

    async paginationClicked(currentPage) {
      await this.fetchCourses(this.typedText || "", currentPage);
    },

    async addCourse(courseID) {
      const newCourse = this.searchResults.find(
        (course) => course.courseCode === courseID
      );
      const courseAdded = await this.$store.dispatch(
        "addCourseToUserStore",
        newCourse
      );
      if (courseAdded)
        this.searchResults = this.searchResults.map((course) =>
          course.courseCode == courseID ? { ...newCourse, added: true } : course
        );
    },
  },

  async mounted() {
    await this.fetchCourses();
  },

  watch: {
    typedText: function (newVal, oldVal) {
      if (_.isNull(newVal)) {
        this.fetchCourses();
      } else if (newVal.trim().length >= 3) {
        this.fetchCourses(newVal);
      } else if (oldVal && newVal.trim().length < oldVal.trim().length) {
        this.fetchCourses();
      }
    },
  },
};
</script>
<style scoped>
.disabled-btn {
  pointer-events: none !important;
}
</style>
