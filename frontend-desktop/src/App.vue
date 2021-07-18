<template>
	<v-app id="inspire">
		<v-navigation-drawer v-model="drawer" :mini-variant.sync="mini" permanent app>
			<v-list-item class="px-2">
				<v-list-item-avatar>
					<v-btn fab>
						<v-icon dark>
							mdi-account-tie
						</v-icon>
					</v-btn>
				</v-list-item-avatar>

				<v-list-item-title>Anonymous User</v-list-item-title>

				<v-btn icon @click.stop="mini = !mini">
					<v-icon>mdi-chevron-left</v-icon>
				</v-btn>
			</v-list-item>

			<v-divider></v-divider>

			<v-list dense>
				<v-list-item @click="navigatePage(item.page)" v-for="item in items" :key="item.title" link>
					<v-list-item-icon>
						<v-icon>{{ item.icon }}</v-icon>
					</v-list-item-icon>

					<v-list-item-content>
						<v-list-item-title>{{ item.title }}</v-list-item-title>
					</v-list-item-content>
				</v-list-item>
			</v-list>
		</v-navigation-drawer>

		<v-app-bar app dense flat>
			<v-toolbar-title>BITS Timetable Visualizer</v-toolbar-title>
		</v-app-bar>

		<v-main>
			<router-view />
		</v-main>
	</v-app>
</template>

<script>
export default {
	data() {
		return {
			drawer: true,
			items: [
				{ title: 'Timetable', icon: 'mdi-calendar-clock-outline', page: 'timetable' },
				{ title: 'Edit Timetable', icon: 'mdi-calendar-edit', page: 'edit-timetable' },
				{ title: 'Search Courses', icon: 'mdi-book-search-outline', page: 'search' },
			],
			mini: true,
		};
	},
	methods: {
		navigatePage(page) {
			this.$router.push(`/${page}`);
		},
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
</style>
