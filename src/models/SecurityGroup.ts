import * as MicrosoftGraph from "@microsoft/microsoft-graph-types";
import mongoose, { Document, Schema } from "mongoose";

export interface ISecurityGroup
  extends Omit<Document, "id">,
    MicrosoftGraph.Group {}

const securityGroupSchema = new Schema<ISecurityGroup>(
  {
    id: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    displayName: {
      type: String,
      required: true,
      index: true,
    },
    mailNickname: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    securityEnabled: {
      type: Boolean,
      required: true,
      index: true,
    },

    description: { type: String },
    mail: {
      type: String,
    },
    createdDateTime: { type: Date },
    renewedDateTime: { type: Date },

    groupTypes: {
      type: [String],
      default: [],
    },
    isAssignableToRole: { type: Boolean },

    onPremisesDomainName: { type: String },
    onPremisesLastSyncDateTime: { type: Date },
    onPremisesNetBiosName: { type: String },
    onPremisesSamAccountName: { type: String },
    onPremisesSecurityIdentifier: { type: String },
    onPremisesSyncEnabled: { type: Boolean },
    proxyAddresses: { type: [String] },
    securityIdentifier: { type: String },
  },
  {
    id: false,
    timestamps: true,
  }
);

const SecurityGroupModel = mongoose.model<ISecurityGroup>(
  "SecurityGroup",
  securityGroupSchema
);

export default SecurityGroupModel;
