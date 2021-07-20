<template>
	<v-row justify="center">
		<v-dialog v-model="dialog" persistent max-width="900" max-height="90%">
			<v-card v-if="imageData">
				<v-img contain lazy-src="https://picsum.photos/id/11/10/6" :src="imageData"></v-img>
				<div class="elevation-5 blue-grey lighten-5">
					<v-card-actions>
						<v-btn color="primary" @click="confirmQuery(false)" text>
							cancel
						</v-btn>
						<v-spacer></v-spacer>
						<v-btn color="primary" @click="confirmQuery(true)" text>
							<v-icon left>mdi-download</v-icon>
							download
						</v-btn>
					</v-card-actions>
				</div>
			</v-card>
		</v-dialog>
	</v-row>
</template>
<script>
export default {
	name: 'showing-screenshot',
	data() {
		return {
			imageData: null,
			dialog: false,
		};
	},
	methods: {
		showDialog(imageData) {
			this.imageData = imageData;
			this.dialog = true;
		},

		hideDialog() {
			this.dialog = false;
			this.imageData = null;
		},

		confirmQuery(choosenOption) {
			this.$emit('confirmQuery', { choosenOption, imageData: this.imageData });
		},
	},
};
</script>
