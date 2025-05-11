import docker
import os
from airflow import DAG
from airflow.providers.docker.operators.docker import DockerOperator
from docker.types import Mount
from datetime import datetime

# path yang dipake buat output transform sama input buat loadernya
used_path = '/app/output/iqplus_test_airflow.json'
mongo_coll = 'iqplus_airflow'

# Mendapatkan path host yang benar dari mount container saat ini
client = docker.from_env()

# Dapatkan container saat ini berdasarkan hostname
current_container = client.containers.get(os.environ['HOSTNAME'])
for mount in current_container.attrs['Mounts']:
    if mount['Destination'] == '/opt/airflow/output':
        host_output_path = mount['Source']  # Path absolut di host
        break
else:
    raise Exception("Mount point /opt/airflow/output not found in container")

print("Host output path:", host_output_path)

default_args = {
    'owner': 'airflow',
    'start_date': datetime(2025, 5, 10),
    'retries': 1
}

with DAG(
    dag_id='iqplus_pipeline',
    default_args=default_args,
    schedule_interval='@daily',
    catchup=False,
    tags=['saham'],
) as dag:
    # TASK: Extract IQPlus Market Data
    extract_iqplus_market = DockerOperator(
        task_id='extract_iqplus_market',
        image='extraction:latest',
        auto_remove=True,
        docker_url="unix://var/run/docker.sock",
        network_mode="saham_net",
        mount_tmp_dir=False,
        mounts=[
            Mount(source=host_output_path, target='/app/output', type='bind')
        ],
        command="python iqplus_extract.py --category market --count 1",
        container_name="pipeline_extract_iqplus_market",
        environment={
            'IQPLUS_OUTPUT_PATH': '/app/output/'
        },
    )
    
    # TASK: Extract IQPlus Stock Data
    extract_iqplus_stock = DockerOperator(
        task_id='extract_iqplus_stock',
        image='extraction:latest',
        auto_remove=True,
        docker_url="unix://var/run/docker.sock",
        network_mode="saham_net",
        mount_tmp_dir=False,
        mounts=[
            Mount(source=host_output_path, target='/app/output', type='bind')
        ],
        command="python iqplus_extract.py --category stock --count 1",
        container_name="pipeline_extract_iqplus_stock",
        environment={
            'IQPLUS_OUTPUT_PATH': '/app/output/'
        },
    )
    
    # TASK: Transform IQPlus Market Data
    transform_iqplus_market = DockerOperator(
        task_id='transform_iqplus_market',
        image='transformer:latest',
        auto_remove=True,
        docker_url="unix://var/run/docker.sock",
        network_mode="saham_net",
        mount_tmp_dir=False,
        mounts = [
            Mount(source=host_output_path, target='/app/output', type='bind')
        ],
        command="python iqplus_transform.py --category market",
        container_name="pipeline_transform_iqplus_market",
        environment={
            'OUTPUT_PATH': used_path,
            'INPUT_PATH': '/app/output',
            'OLLAMA_API': 'http://host.docker.internal:11434'
        },
    )
    
    # TASK: Transform IQPlus Stock Data
    transform_iqplus_stock = DockerOperator(
        task_id='transform_iqplus_stock',
        image='transformer:latest',
        auto_remove=True,
        docker_url="unix://var/run/docker.sock",
        network_mode="saham_net",
        mount_tmp_dir=False,
        mounts=[
            Mount(source=host_output_path, target='/app/output', type='bind')
        ],
        command="python iqplus_transform.py --category stock", 
        container_name="pipeline_transform_iqplus_stock",
        environment={
            'OUTPUT_PATH': used_path,
            'INPUT_PATH': '/app/output',
            'OLLAMA_API': 'http://host.docker.internal:11434'
        },
    )
    
    # TASK: Load IQPlus Data
    load_iqplus = DockerOperator(
        task_id='load_iqplus',
        image='loader:latest',
        auto_remove=True,
        docker_url="unix://var/run/docker.sock",
        network_mode="saham_net",
        mount_tmp_dir=False,
        mounts=[
            Mount(source=host_output_path, target='/app/output', type='bind')
        ],
        command="python loader.py",
        container_name="pipeline_load_iqplus",
        environment={
            'MONGO_COLLECTION': mongo_coll,
            'INPUT_PATH': used_path
        },
    )

    # Define task dependencies
    # Extract tasks to transform tasks
    extract_iqplus_market >> transform_iqplus_market
    extract_iqplus_stock >> transform_iqplus_stock
    
    # Both transform tasks must complete before loading
    transform_iqplus_market >> load_iqplus
    transform_iqplus_stock >> load_iqplus