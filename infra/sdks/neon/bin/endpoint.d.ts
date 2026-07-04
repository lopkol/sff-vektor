import * as pulumi from "@pulumi/pulumi";
export declare class Endpoint extends pulumi.CustomResource {
    /**
     * Get an existing Endpoint resource's state with the given name, ID, and optional extra
     * properties used to qualify the lookup.
     *
     * @param name The _unique_ name of the resulting resource.
     * @param id The _unique_ provider ID of the resource to lookup.
     * @param state Any extra arguments used during the lookup.
     * @param opts Optional settings to control the behavior of the CustomResource.
     */
    static get(name: string, id: pulumi.Input<pulumi.ID>, state?: EndpointState, opts?: pulumi.CustomResourceOptions): Endpoint;
    /**
     * Returns true if the given object is an instance of Endpoint.  This is designed to work even
     * when multiple copies of the Pulumi SDK have been loaded into the same process.
     */
    static isInstance(obj: any): obj is Endpoint;
    readonly autoscalingLimitMaxCu: pulumi.Output<number>;
    readonly autoscalingLimitMinCu: pulumi.Output<number>;
    /**
     * Branch ID.
     */
    readonly branchId: pulumi.Output<string>;
    /**
     * Provisioner The Neon compute provisioner.
     * Specify the k8s-neonvm provisioner to create a compute endpoint that supports Autoscaling.
     */
    readonly computeProvisioner: pulumi.Output<string>;
    /**
     * Disable the endpoint.
     */
    readonly disabled: pulumi.Output<boolean>;
    /**
     * Endpoint URI.
     */
    readonly host: pulumi.Output<string>;
    readonly pgSettings: pulumi.Output<{
        [key: string]: string;
    } | undefined>;
    /**
     * Activate connection pooling.
     * See details: https://neon.tech/docs/connect/connection-pooling
     */
    readonly poolerEnabled: pulumi.Output<boolean>;
    /**
     * Mode of connections pooling.
     * See details: https://neon.tech/docs/connect/connection-pooling
     */
    readonly poolerMode: pulumi.Output<string>;
    /**
     * Project ID.
     */
    readonly projectId: pulumi.Output<string>;
    readonly proxyHost: pulumi.Output<string>;
    /**
     * Deployment region: https://neon.tech/docs/introduction/regions
     */
    readonly regionId: pulumi.Output<string>;
    /**
     * Duration of inactivity in seconds after which the compute endpoint is automatically suspended.
     * The value 0 means use the global default.
     * The value -1 means never suspend. The default value is 300 seconds (5 minutes).
     * The maximum value is 604800 seconds (1 week)
     */
    readonly suspendTimeoutSeconds: pulumi.Output<number>;
    /**
     * Access type. **Note** that a single branch can have only one "read_write" endpoint.
     */
    readonly type: pulumi.Output<string | undefined>;
    /**
     * Create a Endpoint resource with the given unique name, arguments, and options.
     *
     * @param name The _unique_ name of the resource.
     * @param args The arguments to use to populate this resource's properties.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name: string, args: EndpointArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering Endpoint resources.
 */
export interface EndpointState {
    autoscalingLimitMaxCu?: pulumi.Input<number>;
    autoscalingLimitMinCu?: pulumi.Input<number>;
    /**
     * Branch ID.
     */
    branchId?: pulumi.Input<string>;
    /**
     * Provisioner The Neon compute provisioner.
     * Specify the k8s-neonvm provisioner to create a compute endpoint that supports Autoscaling.
     */
    computeProvisioner?: pulumi.Input<string>;
    /**
     * Disable the endpoint.
     */
    disabled?: pulumi.Input<boolean>;
    /**
     * Endpoint URI.
     */
    host?: pulumi.Input<string>;
    pgSettings?: pulumi.Input<{
        [key: string]: pulumi.Input<string>;
    }>;
    /**
     * Activate connection pooling.
     * See details: https://neon.tech/docs/connect/connection-pooling
     */
    poolerEnabled?: pulumi.Input<boolean>;
    /**
     * Mode of connections pooling.
     * See details: https://neon.tech/docs/connect/connection-pooling
     */
    poolerMode?: pulumi.Input<string>;
    /**
     * Project ID.
     */
    projectId?: pulumi.Input<string>;
    proxyHost?: pulumi.Input<string>;
    /**
     * Deployment region: https://neon.tech/docs/introduction/regions
     */
    regionId?: pulumi.Input<string>;
    /**
     * Duration of inactivity in seconds after which the compute endpoint is automatically suspended.
     * The value 0 means use the global default.
     * The value -1 means never suspend. The default value is 300 seconds (5 minutes).
     * The maximum value is 604800 seconds (1 week)
     */
    suspendTimeoutSeconds?: pulumi.Input<number>;
    /**
     * Access type. **Note** that a single branch can have only one "read_write" endpoint.
     */
    type?: pulumi.Input<string>;
}
/**
 * The set of arguments for constructing a Endpoint resource.
 */
export interface EndpointArgs {
    autoscalingLimitMaxCu?: pulumi.Input<number>;
    autoscalingLimitMinCu?: pulumi.Input<number>;
    /**
     * Branch ID.
     */
    branchId: pulumi.Input<string>;
    /**
     * Provisioner The Neon compute provisioner.
     * Specify the k8s-neonvm provisioner to create a compute endpoint that supports Autoscaling.
     */
    computeProvisioner?: pulumi.Input<string>;
    /**
     * Disable the endpoint.
     */
    disabled?: pulumi.Input<boolean>;
    pgSettings?: pulumi.Input<{
        [key: string]: pulumi.Input<string>;
    }>;
    /**
     * Activate connection pooling.
     * See details: https://neon.tech/docs/connect/connection-pooling
     */
    poolerEnabled?: pulumi.Input<boolean>;
    /**
     * Mode of connections pooling.
     * See details: https://neon.tech/docs/connect/connection-pooling
     */
    poolerMode?: pulumi.Input<string>;
    /**
     * Project ID.
     */
    projectId: pulumi.Input<string>;
    /**
     * Deployment region: https://neon.tech/docs/introduction/regions
     */
    regionId?: pulumi.Input<string>;
    /**
     * Duration of inactivity in seconds after which the compute endpoint is automatically suspended.
     * The value 0 means use the global default.
     * The value -1 means never suspend. The default value is 300 seconds (5 minutes).
     * The maximum value is 604800 seconds (1 week)
     */
    suspendTimeoutSeconds?: pulumi.Input<number>;
    /**
     * Access type. **Note** that a single branch can have only one "read_write" endpoint.
     */
    type?: pulumi.Input<string>;
}
