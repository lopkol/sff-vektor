import * as pulumi from "@pulumi/pulumi";
import * as inputs from "./types/input";
import * as outputs from "./types/output";
export declare class Project extends pulumi.CustomResource {
    /**
     * Get an existing Project resource's state with the given name, ID, and optional extra
     * properties used to qualify the lookup.
     *
     * @param name The _unique_ name of the resulting resource.
     * @param id The _unique_ provider ID of the resource to lookup.
     * @param state Any extra arguments used during the lookup.
     * @param opts Optional settings to control the behavior of the CustomResource.
     */
    static get(name: string, id: pulumi.Input<pulumi.ID>, state?: ProjectState, opts?: pulumi.CustomResourceOptions): Project;
    /**
     * Returns true if the given object is an instance of Project.  This is designed to work even
     * when multiple copies of the Pulumi SDK have been loaded into the same process.
     */
    static isInstance(obj: any): obj is Project;
    /**
     * A list of IP addresses that are allowed to connect to the endpoints.
     * Note that the feature is available to the Neon Scale plans only. Details: https://neon.tech/docs/manage/projects#configure-ip-allow
     */
    readonly allowedIps: pulumi.Output<string[] | undefined>;
    /**
     * Set to 'yes' to activate, 'no' to deactivate explicitly, and omit to keep the default value.
     * Apply the allow-list to the protected branches only.
     * Note that the feature is available to the Neon Scale plans only.
     */
    readonly allowedIpsProtectedBranchesOnly: pulumi.Output<string | undefined>;
    /**
     * Set to 'yes' to activate, 'no' to deactivate explicitly, and omit to keep the default value.
     * Block connections from public internet. This supersedes the AllowedIPs list.
     */
    readonly blockPublicConnections: pulumi.Output<string | undefined>;
    /**
     * Set to 'yes' to activate, 'no' to deactivate explicitly, and omit to keep the default value.
     * Block connections that use VPC endpoints.
     */
    readonly blockVpcConnections: pulumi.Output<string | undefined>;
    readonly branch: pulumi.Output<outputs.ProjectBranch | undefined>;
    /**
     * Provisioner The Neon compute provisioner.
     * Specify the k8s-neonvm provisioner to create a compute endpoint that supports Autoscaling.
     */
    readonly computeProvisioner: pulumi.Output<string>;
    /**
     * Default connection uri. **Note** that it contains access credentials.
     */
    readonly connectionUri: pulumi.Output<string>;
    /**
     * Default connection uri with the traffic via pooler. **Note** that it contains access credentials.
     */
    readonly connectionUriPooler: pulumi.Output<string>;
    /**
     * Default database host.
     */
    readonly databaseHost: pulumi.Output<string>;
    /**
     * Default endpoint host via pooler.
     */
    readonly databaseHostPooler: pulumi.Output<string>;
    /**
     * Default database name.
     */
    readonly databaseName: pulumi.Output<string>;
    /**
     * Default database access password.
     */
    readonly databasePassword: pulumi.Output<string>;
    /**
     * Default database role.
     */
    readonly databaseUser: pulumi.Output<string>;
    /**
     * Default branch ID.
     */
    readonly defaultBranchId: pulumi.Output<string>;
    /**
     * Default endpoint ID.
     */
    readonly defaultEndpointId: pulumi.Output<string>;
    readonly defaultEndpointSettings: pulumi.Output<outputs.ProjectDefaultEndpointSettings | undefined>;
    /**
     * Set to 'yes' to activate, 'no' to deactivate explicitly, and omit to keep the default value.
     * Sets wal_level=logical for all compute endpoints in this project.
     * All active endpoints will be suspended. Once enabled, logical replication cannot be disabled.
     * See details: https://neon.tech/docs/introduction/logical-replication
     */
    readonly enableLogicalReplication: pulumi.Output<string | undefined>;
    /**
     * The number of seconds to retain the point-in-time restore (PITR) backup history for this project.
     * Default: 1 day, see https://neon.tech/docs/reference/glossary#point-in-time-restore.
     */
    readonly historyRetentionSeconds: pulumi.Output<number | undefined>;
    /**
     * A time period during which Neon may perform maintenance on the project's infrastructure. During this time, the project's compute endpoints may be unavailable and existing connections can be interrupted.
     */
    readonly maintenanceWindow: pulumi.Output<outputs.ProjectMaintenanceWindow | undefined>;
    /**
     * Project name.
     */
    readonly name: pulumi.Output<string>;
    /**
     * Identifier of the organisation to which this project belongs.
     */
    readonly orgId: pulumi.Output<string | undefined>;
    /**
     * Postgres version
     */
    readonly pgVersion: pulumi.Output<number>;
    /**
     * Per-project consumption quota. If the quota is exceeded, all active computes
     * are automatically suspended and it will not be possible to start them with
     * an API method call or incoming proxy connections. The only exception is
     * logical_size_bytes, which is applied on per-branch basis, i.e., only the
     * compute on the branch that exceeds the logical_size quota will be suspended.
     *
     * Quotas are enforced based on per-project consumption metrics with the same names,
     * which are reset at the end of each billing period (the first day of the month).
     * Logical size is also an exception in this case, as it represents the total size
     * of data stored in a branch, so it is not reset.
     *
     * The zero value per attributed means 'unlimited'.
     */
    readonly quota: pulumi.Output<outputs.ProjectQuota | undefined>;
    /**
     * Deployment region: https://neon.tech/docs/introduction/regions
     */
    readonly regionId: pulumi.Output<string>;
    /**
     * Set to 'yes' to activate, 'no' to deactivate explicitly, and omit to keep the default value.
     * Whether or not passwords are stored for roles in the Neon project.
     * Storing passwords facilitates access to Neon features that require authorization.
     */
    readonly storePassword: pulumi.Output<string | undefined>;
    /**
     * Create a Project resource with the given unique name, arguments, and options.
     *
     * @param name The _unique_ name of the resource.
     * @param args The arguments to use to populate this resource's properties.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name: string, args?: ProjectArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering Project resources.
 */
export interface ProjectState {
    /**
     * A list of IP addresses that are allowed to connect to the endpoints.
     * Note that the feature is available to the Neon Scale plans only. Details: https://neon.tech/docs/manage/projects#configure-ip-allow
     */
    allowedIps?: pulumi.Input<pulumi.Input<string>[] | undefined>;
    /**
     * Set to 'yes' to activate, 'no' to deactivate explicitly, and omit to keep the default value.
     * Apply the allow-list to the protected branches only.
     * Note that the feature is available to the Neon Scale plans only.
     */
    allowedIpsProtectedBranchesOnly?: pulumi.Input<string | undefined>;
    /**
     * Set to 'yes' to activate, 'no' to deactivate explicitly, and omit to keep the default value.
     * Block connections from public internet. This supersedes the AllowedIPs list.
     */
    blockPublicConnections?: pulumi.Input<string | undefined>;
    /**
     * Set to 'yes' to activate, 'no' to deactivate explicitly, and omit to keep the default value.
     * Block connections that use VPC endpoints.
     */
    blockVpcConnections?: pulumi.Input<string | undefined>;
    branch?: pulumi.Input<inputs.ProjectBranch | undefined>;
    /**
     * Provisioner The Neon compute provisioner.
     * Specify the k8s-neonvm provisioner to create a compute endpoint that supports Autoscaling.
     */
    computeProvisioner?: pulumi.Input<string | undefined>;
    /**
     * Default connection uri. **Note** that it contains access credentials.
     */
    connectionUri?: pulumi.Input<string | undefined>;
    /**
     * Default connection uri with the traffic via pooler. **Note** that it contains access credentials.
     */
    connectionUriPooler?: pulumi.Input<string | undefined>;
    /**
     * Default database host.
     */
    databaseHost?: pulumi.Input<string | undefined>;
    /**
     * Default endpoint host via pooler.
     */
    databaseHostPooler?: pulumi.Input<string | undefined>;
    /**
     * Default database name.
     */
    databaseName?: pulumi.Input<string | undefined>;
    /**
     * Default database access password.
     */
    databasePassword?: pulumi.Input<string | undefined>;
    /**
     * Default database role.
     */
    databaseUser?: pulumi.Input<string | undefined>;
    /**
     * Default branch ID.
     */
    defaultBranchId?: pulumi.Input<string | undefined>;
    /**
     * Default endpoint ID.
     */
    defaultEndpointId?: pulumi.Input<string | undefined>;
    defaultEndpointSettings?: pulumi.Input<inputs.ProjectDefaultEndpointSettings | undefined>;
    /**
     * Set to 'yes' to activate, 'no' to deactivate explicitly, and omit to keep the default value.
     * Sets wal_level=logical for all compute endpoints in this project.
     * All active endpoints will be suspended. Once enabled, logical replication cannot be disabled.
     * See details: https://neon.tech/docs/introduction/logical-replication
     */
    enableLogicalReplication?: pulumi.Input<string | undefined>;
    /**
     * The number of seconds to retain the point-in-time restore (PITR) backup history for this project.
     * Default: 1 day, see https://neon.tech/docs/reference/glossary#point-in-time-restore.
     */
    historyRetentionSeconds?: pulumi.Input<number | undefined>;
    /**
     * A time period during which Neon may perform maintenance on the project's infrastructure. During this time, the project's compute endpoints may be unavailable and existing connections can be interrupted.
     */
    maintenanceWindow?: pulumi.Input<inputs.ProjectMaintenanceWindow | undefined>;
    /**
     * Project name.
     */
    name?: pulumi.Input<string | undefined>;
    /**
     * Identifier of the organisation to which this project belongs.
     */
    orgId?: pulumi.Input<string | undefined>;
    /**
     * Postgres version
     */
    pgVersion?: pulumi.Input<number | undefined>;
    /**
     * Per-project consumption quota. If the quota is exceeded, all active computes
     * are automatically suspended and it will not be possible to start them with
     * an API method call or incoming proxy connections. The only exception is
     * logical_size_bytes, which is applied on per-branch basis, i.e., only the
     * compute on the branch that exceeds the logical_size quota will be suspended.
     *
     * Quotas are enforced based on per-project consumption metrics with the same names,
     * which are reset at the end of each billing period (the first day of the month).
     * Logical size is also an exception in this case, as it represents the total size
     * of data stored in a branch, so it is not reset.
     *
     * The zero value per attributed means 'unlimited'.
     */
    quota?: pulumi.Input<inputs.ProjectQuota | undefined>;
    /**
     * Deployment region: https://neon.tech/docs/introduction/regions
     */
    regionId?: pulumi.Input<string | undefined>;
    /**
     * Set to 'yes' to activate, 'no' to deactivate explicitly, and omit to keep the default value.
     * Whether or not passwords are stored for roles in the Neon project.
     * Storing passwords facilitates access to Neon features that require authorization.
     */
    storePassword?: pulumi.Input<string | undefined>;
}
/**
 * The set of arguments for constructing a Project resource.
 */
export interface ProjectArgs {
    /**
     * A list of IP addresses that are allowed to connect to the endpoints.
     * Note that the feature is available to the Neon Scale plans only. Details: https://neon.tech/docs/manage/projects#configure-ip-allow
     */
    allowedIps?: pulumi.Input<pulumi.Input<string>[] | undefined>;
    /**
     * Set to 'yes' to activate, 'no' to deactivate explicitly, and omit to keep the default value.
     * Apply the allow-list to the protected branches only.
     * Note that the feature is available to the Neon Scale plans only.
     */
    allowedIpsProtectedBranchesOnly?: pulumi.Input<string | undefined>;
    /**
     * Set to 'yes' to activate, 'no' to deactivate explicitly, and omit to keep the default value.
     * Block connections from public internet. This supersedes the AllowedIPs list.
     */
    blockPublicConnections?: pulumi.Input<string | undefined>;
    /**
     * Set to 'yes' to activate, 'no' to deactivate explicitly, and omit to keep the default value.
     * Block connections that use VPC endpoints.
     */
    blockVpcConnections?: pulumi.Input<string | undefined>;
    branch?: pulumi.Input<inputs.ProjectBranch | undefined>;
    /**
     * Provisioner The Neon compute provisioner.
     * Specify the k8s-neonvm provisioner to create a compute endpoint that supports Autoscaling.
     */
    computeProvisioner?: pulumi.Input<string | undefined>;
    defaultEndpointSettings?: pulumi.Input<inputs.ProjectDefaultEndpointSettings | undefined>;
    /**
     * Set to 'yes' to activate, 'no' to deactivate explicitly, and omit to keep the default value.
     * Sets wal_level=logical for all compute endpoints in this project.
     * All active endpoints will be suspended. Once enabled, logical replication cannot be disabled.
     * See details: https://neon.tech/docs/introduction/logical-replication
     */
    enableLogicalReplication?: pulumi.Input<string | undefined>;
    /**
     * The number of seconds to retain the point-in-time restore (PITR) backup history for this project.
     * Default: 1 day, see https://neon.tech/docs/reference/glossary#point-in-time-restore.
     */
    historyRetentionSeconds?: pulumi.Input<number | undefined>;
    /**
     * A time period during which Neon may perform maintenance on the project's infrastructure. During this time, the project's compute endpoints may be unavailable and existing connections can be interrupted.
     */
    maintenanceWindow?: pulumi.Input<inputs.ProjectMaintenanceWindow | undefined>;
    /**
     * Project name.
     */
    name?: pulumi.Input<string | undefined>;
    /**
     * Identifier of the organisation to which this project belongs.
     */
    orgId?: pulumi.Input<string | undefined>;
    /**
     * Postgres version
     */
    pgVersion?: pulumi.Input<number | undefined>;
    /**
     * Per-project consumption quota. If the quota is exceeded, all active computes
     * are automatically suspended and it will not be possible to start them with
     * an API method call or incoming proxy connections. The only exception is
     * logical_size_bytes, which is applied on per-branch basis, i.e., only the
     * compute on the branch that exceeds the logical_size quota will be suspended.
     *
     * Quotas are enforced based on per-project consumption metrics with the same names,
     * which are reset at the end of each billing period (the first day of the month).
     * Logical size is also an exception in this case, as it represents the total size
     * of data stored in a branch, so it is not reset.
     *
     * The zero value per attributed means 'unlimited'.
     */
    quota?: pulumi.Input<inputs.ProjectQuota | undefined>;
    /**
     * Deployment region: https://neon.tech/docs/introduction/regions
     */
    regionId?: pulumi.Input<string | undefined>;
    /**
     * Set to 'yes' to activate, 'no' to deactivate explicitly, and omit to keep the default value.
     * Whether or not passwords are stored for roles in the Neon project.
     * Storing passwords facilitates access to Neon features that require authorization.
     */
    storePassword?: pulumi.Input<string | undefined>;
}
//# sourceMappingURL=project.d.ts.map