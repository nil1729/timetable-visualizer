<template>
	<v-dialog v-model="dialog" persistent max-width="600" width="fit-content">
		<v-card>
			<v-card-title class="text-body-1"> </v-card-title>
			<v-card-text class="pb-0">
				<p class="font-weight-black mb-2">
					Steps to follow after downloading the .ics file
				</p>
				<div class="text-body-2 font-weight-medium mt-0">
					<ul>
						<li>
							Open the google calendar settings from the top-right corner.
						</li>
						<li>
							In the window that opens, select Import & Export from the left navigation bar.
						</li>
						<li>
							Browse the .ics file from your computer and import it under the import heading.
						</li>
						<li>
							Click the import button.
						</li>
					</ul>
				</div>
				<p class="font-weight-black mt-3">
					If you wish to skip these steps, you can directly get the .ics file mailed to your email
					address, following which you can import the events into Google Calendar by just opening
					the attached .ics file
				</p>
			</v-card-text>
			<v-container fluid class="px-5">
				<v-row>
					<v-col class="mb-2 pb-0">
						<v-text-field
							solo
							label="Enter your Email Address"
							prepend-inner-icon="mdi-at"
							v-model="emailAddress"
							append-outer-icon="mdi-send"
							dense
							clearable
							type="text"
							clear-icon="mdi-close"
							ref="myEmailAddressInput"
							:rules="[
								() => !!emailAddress || 'This field is required',
								() => checkEmailIsValid(emailAddress) || 'Invalid Email Address',
							]"
							required
							@click:append-outer="confirmQuery('email')"
						></v-text-field>
					</v-col>
				</v-row>
			</v-container>
			<v-card-actions class="mt-0 pt-0">
				<v-btn color="green darken-1" text @click="hideDialog">
					Close
				</v-btn>
				<v-spacer></v-spacer>
				<v-btn color="primary" @click="confirmQuery('download')" text>
					<v-icon left>mdi-download</v-icon>
					download ics file
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>
<script>
import validator from 'validator';
export default {
	name: 'ics-file-dialog',
	data() {
		return {
			dialog: false,
			emailAddress: '',
		};
	},
	computed: {
		checkEmailIsValid: () => (email) => {
			return validator.isEmail(email);
		},
	},
	methods: {
		showDialog() {
			this.dialog = true;
		},

		hideDialog() {
			this.dialog = false;
			this.$refs.myEmailAddressInput.reset();
			this.emailAddress = '';
		},

		confirmQuery(chosenOption) {
			if (chosenOption === 'email' && !this.checkEmailIsValid(this.emailAddress)) {
				this.$refs.myEmailAddressInput.validate(true);
				return;
			}
			this.$emit('confirmQueryForICS', { chosenOption, userEmail: this.emailAddress });
		},
	},
};
</script>
<style scoped></style>
