from airflow import DAG
from airflow.providers.docker.operators.docker import DockerOperator
from docker.types import Mount
from datetime import datetime

# set path disinii
used_path = '/app/output/idx_data.json'
mongo_coll = 'idx_data'

host_output_path = '/home/azureee/project/PahamSaham/output'

default_args = {
    'owner': 'airflow',
    'start_date': datetime(2025, 5, 10),
    'retries': 1
}

with DAG(
    dag_id='idx_pipeline',
    default_args=default_args,
    schedule_interval='@yearly',  # Set to run yearly
    catchup=False,
    tags=['saham'],
) as dag:
    # TASK: Extract IDX Data
    extract_idx = DockerOperator(
        task_id='extract_idx',
        image='extraction:latest',
        auto_remove=True,
        docker_url="unix://var/run/docker.sock",
        network_mode="saham_net",
        mount_tmp_dir=False,
        mounts=[
            Mount(source=host_output_path, target='/app/output', type='bind'),
            Mount(source=f"{host_output_path}/idx_zip", target='/output/idx_zip', type='bind'),
            Mount(source=f"{host_output_path}/idx_extracted", target='/output/idx_extracted', type='bind'),
            Mount(source=f"{host_output_path}/debug(ss)", target='/screenshot', type='bind')
        ],
        command="python idx_extract.py",
        container_name="pipeline_extract_idx",
        environment={
            'PYTHONUNBUFFERED': '1'
        },
        shm_size=2000000000,  # 2G shared memory
    )
    
    # TASK: Transform IDX Data
    transform_idx = DockerOperator(
        task_id='transform_idx',
        image='transformer:latest',
        auto_remove=True,
        docker_url="unix://var/run/docker.sock",
        network_mode="saham_net",
        mount_tmp_dir=False,
        mounts=[
            Mount(source=host_output_path, target='/app/output', type='bind'),
            Mount(source=f"{host_output_path}/idx_extracted", target='/app/extract/idx_extracted', type='bind')
        ],
        command="python idx_transform.py",
        container_name="pipeline_transform_idx",
        environment={
            'OUTPUT_PATH': used_path,
            'INPUT_PATH': '/app/output/idx_extracted'
        },
    )
    
    # TASK: Load IDX Data
    load_idx = DockerOperator(
        task_id='load_idx',
        image='loader:latest',
        auto_remove=True,
        docker_url="unix://var/run/docker.sock",
        network_mode="saham_net",
        mount_tmp_dir=False,
        mounts=[
            Mount(source=host_output_path, target='/app/output', type='bind')
        ],
        command="python loader.py",
        container_name="pipeline_load_idx",
        environment={
            'MONGO_COLLECTION': mongo_coll,
            'INPUT_PATH': used_path
        },
    )

    # Define task dependencies
    extract_idx >> transform_idx >> load_idx
