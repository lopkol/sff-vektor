import * as pulumi from "@pulumi/pulumi";
export declare class Branch extends pulumi.CustomResource {
    /**
     * Get an existing Branch resource's state with the given name, ID, and optional extra
     * properties used to qualify the lookup.
     *
     * @param name The _unique_ name of the resulting resource.
     * @param id The _unique_ provider ID of the resource to lookup.
     * @param state Any extra arguments used during the lookup.
     * @param opts Optional settings to control the behavior of the CustomResource.
     */
    static get(name: string, id: pulumi.Input<pulumi.ID>, state?: BranchState, opts?: pulumi.CustomResourceOptions): Branch;
    /**
     * Returns true if the given object is an instance of Branch.  This is designed to work even
     * when multiple copies of the Pulumi SDK have been loaded into the same process.
     */
    static isInstance(obj: any): obj is Branch;
    /**
     * Branch logical size in MB.
     */
    readonly logicalSize: pulumi.Output<number>;
    /**
     * Branch name.
     */
    readonly name: pulumi.Output<string>;
    /**
     * ID of the branch to check out.
     */
    readonly parentId: pulumi.Output<string>;
    /**
     * Log Sequence Number (LSN) horizon for the data to be present in the new branch.
     * See details: https://neon.tech/docs/reference/glossary/#lsn
     */
    readonly parentLsn: pulumi.Output<string>;
    /**
     * Timestamp horizon for the data to be present in the new branch.
     * **Note**: it's defined as Unix epoch.'
     */
    readonly parentTimestamp: pulumi.Output<number>;
    /**
     * Project ID.
     */
    readonly projectId: pulumi.Output<string>;
    /**
     * Set to 'yes' to activate, 'no' to deactivate explicitly, and omit to keep the default value.
     * Set whether the branch is protected.
     */
    readonly protected: pulumi.Output<string | undefined>;
    /**
     * Create a Branch resource with the given unique name, arguments, and options.
     *
     * @param name The _unique_ name of the resource.
     * @param args The arguments to use to populate this resource's properties.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name: string, args: BranchArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering Branch resources.
 */
export interface BranchState {
    /**
     * Branch logical size in MB.
     */
    logicalSize?: pulumi.Input<number>;
    /**
     * Branch name.
     */
    name?: pulumi.Input<string>;
    /**
     * ID of the branch to check out.
     */
    parentId?: pulumi.Input<string>;
    /**
     * Log Sequence Number (LSN) horizon for the data to be present in the new branch.
     * See details: https://neon.tech/docs/reference/glossary/#lsn
     */
    parentLsn?: pulumi.Input<string>;
    /**
     * Timestamp horizon for the data to be present in the new branch.
     * **Note**: it's defined as Unix epoch.'
     */
    parentTimestamp?: pulumi.Input<number>;
    /**
     * Project ID.
     */
    projectId?: pulumi.Input<string>;
    /**
     * Set to 'yes' to activate, 'no' to deactivate explicitly, and omit to keep the default value.
     * Set whether the branch is protected.
     */
    protected?: pulumi.Input<string>;
}
/**
 * The set of arguments for constructing a Branch resource.
 */
export interface BranchArgs {
    /**
     * Branch name.
     */
    name?: pulumi.Input<string>;
    /**
     * ID of the branch to check out.
     */
    parentId?: pulumi.Input<string>;
    /**
     * Log Sequence Number (LSN) horizon for the data to be present in the new branch.
     * See details: https://neon.tech/docs/reference/glossary/#lsn
     */
    parentLsn?: pulumi.Input<string>;
    /**
     * Timestamp horizon for the data to be present in the new branch.
     * **Note**: it's defined as Unix epoch.'
     */
    parentTimestamp?: pulumi.Input<number>;
    /**
     * Project ID.
     */
    projectId: pulumi.Input<string>;
    /**
     * Set to 'yes' to activate, 'no' to deactivate explicitly, and omit to keep the default value.
     * Set whether the branch is protected.
     */
    protected?: pulumi.Input<string>;
}
