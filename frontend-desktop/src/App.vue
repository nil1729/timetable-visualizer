<template>
	<v-app id="inspire">
		<v-navigation-drawer v-model="drawer" :mini-variant.sync="mini" permanent expand-on-hover app>
			<v-list-item class="px-2">
				<v-list-item-avatar>
					<img src="@/assets/bits-logo.png" alt="John" />
				</v-list-item-avatar>

				<v-list-item-title>BITS Student</v-list-item-title>

				<v-btn icon @click.stop="mini = !mini">
					<v-icon>mdi-chevron-left</v-icon>
				</v-btn>
			</v-list-item>

			<v-divider></v-divider>

			<v-list nav dense>
				<v-list-item-group v-model="selectedMenuTab" color="primary" mandatory>
					<v-list-item
						@click="navigatePage(item.page)"
						v-for="item in items"
						:key="item.title"
						link
					>
						<v-list-item-icon>
							<v-icon>{{ item.icon }}</v-icon>
						</v-list-item-icon>

						<v-list-item-content>
							<v-list-item-title>{{ item.title }}</v-list-item-title>
						</v-list-item-content>
					</v-list-item>
				</v-list-item-group>
			</v-list>

			<template v-slot:append>
				<v-list nav dense>
					<v-list-item link @click="openFeedbackDialog">
						<v-list-item-icon>
							<v-icon color="info">mdi-comment-account-outline</v-icon>
						</v-list-item-icon>

						<v-list-item-content>
							<v-list-item-title class="info--text"> Feedback </v-list-item-title>
						</v-list-item-content>
					</v-list-item>
				</v-list>
			</template>
		</v-navigation-drawer>

		<v-app-bar app dense flat>
			<v-toolbar-title>BITS Timetable Companion</v-toolbar-title>
			<v-spacer></v-spacer>

			<v-btn icon @click="changeTheme">
				<v-icon v-if="$vuetify.theme.isDark">mdi-weather-night</v-icon>
				<v-icon v-else>mdi-white-balance-sunny</v-icon>
			</v-btn>
		</v-app-bar>

		<v-main>
			<router-view />
			<app-notification-alert />
			<save-change-btn />
			<feedback-dialog ref="myFeedbackDialog" @feedbackSubmit="sendFeedbackToMe" />
		</v-main>

		<v-divider></v-divider>
		<v-footer :padless="true">
			<v-card flat tile width="100%">
				<v-card-text class="my-footer-text">
					<h4>
						<v-icon>mdi-xml</v-icon> with <v-icon small color="red">mdi-heart</v-icon> and
						<v-icon small color="#8b6910">mdi-coffee</v-icon> By
						<a href="https://github.com/nil1729" target="_blank" class="my-text-link">Nil Deb</a> &
						<a href="https://github.com/spidy102" target="_blank" class="my-text-link">Shaurya</a>
					</h4>
					<h4>
						<a
							href="https://github.com/nil1729/timetable-visualizer"
							target="_blank"
							class="my-text-link"
						>
							<v-avatar size="30"> <img src="@/assets/github.svg" alt="John" /> </v-avatar>
						</a>
					</h4>
				</v-card-text>
			</v-card>
		</v-footer>
	</v-app>
</template>

<script>
import Alerts from '@/components/layouts/Alerts.vue';
import SaveChangeBtn from '@/components/layouts/SaveChangeBtn.vue';
import FeedbackDialog from '@/components/layouts/FeedbackDialog.vue';
import _ from 'lodash';

export default {
	name: 'bits-timetable-visualizer-app',
	components: {
		'app-notification-alert': Alerts,
		'save-change-btn': SaveChangeBtn,
		'feedback-dialog': FeedbackDialog,
	},
	data() {
		return {
			drawer: true,
			items: [
				{ title: 'Timetable', icon: 'mdi-calendar-clock-outline', page: '' },
				{ title: 'Edit Timetable', icon: 'mdi-calendar-edit', page: 'edit-timetable' },
				{ title: 'Generate Timetable', icon: 'mdi-cog-sync-outline', page: 'generate-timetable' },
				{ title: 'Search Courses', icon: 'mdi-book-search-outline', page: 'search' },
				{ title: 'Share Timetable', icon: 'mdi-share-all-outline', page: 'share-timetable' },
			],
			mini: true,
			selectedMenuTab: 0,
		};
	},
	methods: {
		navigatePage(page) {
			let newPath = `/${page}`;
			this.selectedMenuTab = this.items.findIndex((pg) => pg.page === page);
			if (this.$route.path !== newPath) this.$router.push(newPath);
		},
		changeTheme() {
			localStorage.setItem(
				'THEME_MODE',
				JSON.stringify({
					theme: this.$vuetify.theme.isDark ? 'light' : 'dark',
				})
			);
			this.$vuetify.theme.dark = this.$vuetify.theme.isDark ? false : true;
		},
		openFeedbackDialog() {
			this.$refs.myFeedbackDialog.showDialog();
		},
		async sendFeedbackToMe(data) {
			try {
				const resp = await this.$store.dispatch('sendRequest', {
					method: 'POST',
					url: `feedback/to-me`,
					requestBody: {
						feedback_message: data.text,
						rating: `${data.rating}/5`,
					},
				});
				if (resp.success) {
					this.$store.commit('ADD_NOTIFICATION', {
						message: _.upperCase('thanks for your feedback'),
						type: 'success',
					});
				}
			} catch (e) {
				this.$store.commit('ADD_NOTIFICATION', {
					message: _.upperCase('unknown error occurred while processing your feedback'),
					type: 'error',
				});
			}
		},
	},
	watch: {
		$route: function (newVal) {
			this.selectedMenuTab = this.items.findIndex((item) => `/${item.page}` === newVal.path);
		},
	},
	async created() {
		await this.$store.dispatch('removeOldData');
		const route = this.$route;
		this.selectedMenuTab = this.items.findIndex((item) => `/${item.page}` === route.path);
	},
};
</script>

<style>
::-webkit-scrollbar {
	background-color: #efeefe;
	width: 16px;
}
::-webkit-scrollbar-track {
	background-color: #efeefe;
}
::-webkit-scrollbar-track:hover {
	background-color: #f4f4f4;
}
::-webkit-scrollbar-thumb {
	background-color: #babac0;
	border-radius: 16px;
	border: 5px solid #efeefe;
}
::-webkit-scrollbar-thumb:hover {
	background-color: #a0a0a5;
	border: 4px solid #f4f4f4;
}
::-webkit-scrollbar-button {
	display: none;
}

/* Calender Styles */
.v-calendar.my-edit-calender .v-event-timed-container,
.v-calendar.my-view-calender .v-event-timed-container {
	margin-right: 0 !important;
}
.v-calendar.my-edit-calender .v-btn--fab.v-size--default,
.v-calendar.my-view-calender .v-btn--fab.v-size--default {
	height: 40px !important;
	width: 40px !important;
	margin-top: 3px !important;
}
.v-calendar.my-view-calender .v-btn--fab.v-size--small {
	height: 35px !important;
	width: 35px !important;
	margin: 2px 0 3px !important;
}
.v-calendar.my-view-calender .v-event.v-event-start.v-event-end {
	width: 100% !important;
}
.my-text-link {
	text-decoration: none;
	color: inherit;
}
.my-footer-text {
	padding-right: 40px;
	padding-left: 75px;
	padding-top: 10px;
	padding-bottom: 10px;
	display: flex;
	justify-content: space-between;
	align-content: center;
}
</style>
