v-textarea<template>
	<v-dialog v-model="dialog" persistent max-width="800" width="fit-content">
		<v-card width="700">
			<v-container fluid class="pt-5 pr-5">
				<v-row>
					<v-col class="mb-0 pb-0" cols="7">
						<v-textarea
							solo
							v-model="feedbackText"
							ref="myFeedbackForm"
							label="Write your valuable feedback ..."
							class="my-feedback-input"
							counter
							prepend-icon="mdi-comment"
							no-resize
							rows="9"
							clear-icon="mdi-close"
							clearable
							maxlength="300"
							:rules="[
								() => !!feedbackText || 'This field is required',
								() =>
									(feedbackText && feedbackText.trim().length !== 0) ||
									'Please fill out this field',
								() =>
									(feedbackText && feedbackText.length <= 300) ||
									'Please write the feedback within 300 characters',
							]"
						></v-textarea>
					</v-col>
					<v-col class="mb-0 pb-0" cols="5">
						<div>
							<v-rating
								background-color="warning lighten-3"
								half-increments
								hover
								length="5"
								size="50"
								color="warning"
								large
								value="4"
								v-model="feedbackRating"
							></v-rating>
						</div>
						<div class="mt-4">
							<v-img src="@/assets/feedback.jpg" height="200"></v-img>
						</div>
					</v-col>
				</v-row>
			</v-container>
			<v-card-actions class="mt-0 pt-0">
				<v-btn color="green darken-1" text @click="hideDialog">
					Close
				</v-btn>
				<v-spacer></v-spacer>
				<v-btn color="green darken-1" text @click="feedbackSubmit">
					submit
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>
<script>
export default {
	name: 'feedback-dialog',
	data() {
		return {
			dialog: false,
			feedbackText: '',
			feedbackRating: 3,
		};
	},
	methods: {
		showDialog() {
			this.dialog = true;
		},

		hideDialog() {
			this.dialog = false;
			this.$refs.myFeedbackForm.reset();
			this.feedbackText = '';
			this.feedbackRating = 3;
		},

		feedbackSubmit() {
			if (this.feedbackText.trim().length === 0) {
				this.$refs.myFeedbackForm.validate(true);
				return;
			}

			this.$emit('feedbackSubmit', { text: this.feedbackText, rating: this.feedbackRating });
			this.hideDialog();
		},
	},
};
</script>
<style scoped>
/* .v-text-field__details {
	display: none !important;
} */
</style>
