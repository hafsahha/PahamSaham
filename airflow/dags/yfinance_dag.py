from airflow import DAG
from airflow.providers.docker.operators.docker import DockerOperator
from docker.types import Mount
from datetime import datetime

# set dsini yh ...
used_path = '/app/output/yfinance_data.json'
mongo_coll = 'yfinance_data_testing'

host_output_path = '/home/azureee/project/PahamSaham/output'

default_args = {
    'owner': 'airflow',
    'start_date': datetime(2025, 5, 10),
    'retries': 1
}

with DAG(
    dag_id='yfinance_pipeline_1',
    default_args=default_args,
    schedule_interval='@daily',
    catchup=False,
    tags=['saham'],
) as dag:
    # TASK: YFINANCE
    extract_yfinance = DockerOperator(
        task_id='extract_yfinance',
        image='extraction:latest',
        auto_remove=True,
        docker_url="unix://var/run/docker.sock",
        network_mode="saham_net",
        mount_tmp_dir=False,
        mounts=[
            Mount(source=host_output_path, target='/app/output', type='bind')
        ],
        command="python yfinance_extract.py",
        container_name="pipeline_extract_yfinance",
        environment={
            'YFINANCE_OUTPUT_PATH': used_path
        },
    )
    
    load_yfinance = DockerOperator(
        task_id='load_yfinance',
        image='loader:latest',
        auto_remove=True,
        docker_url="unix://var/run/docker.sock",
        network_mode="saham_net",
        mount_tmp_dir=False,
        mounts=[
            Mount(source=host_output_path, target='/app/output', type='bind')
        ],
        command="python loader.py",
        container_name="pipeline_load_yfinance",
        environment={
            'MONGO_COLLECTION': mongo_coll,
            'INPUT_PATH': used_path
        },
    )
    
    extract_yfinance >> load_yfinance
