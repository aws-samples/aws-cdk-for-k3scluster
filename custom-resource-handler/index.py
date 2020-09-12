import boto3, json

def on_event(event, context):
    print(event)
    request_type = event["RequestType"]
    if request_type == "Create":
        return on_create(event)
    if request_type == "Update":
        return on_update(event)
    if request_type == "Delete":
        return on_delete(event)
    raise Exception("Invalid request type: %s" % request_type)

def on_create(event):
    output = {'Status': 'Created'}
    return {"Data": output}

def on_update(event):
    output = {'Status': 'Updated'}
    return {"Data": output}

def on_delete(event):
    props = event["ResourceProperties"]
    print("create new resource with props %s" % props)
    k3sBucket_name = props["Bucket"]

    s3 = boto3.resource('s3')
    bucket = s3.Bucket(k3sBucket_name)
    for obj in bucket.objects.filter():
        s3.Object(bucket.name, obj.key).delete()
    output = {'Status': 'success'}
    
    print(output)
    return {"Data": output}
    