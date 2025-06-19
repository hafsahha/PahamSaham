from airflow import DAG
from airflow.providers.docker.operators.docker import DockerOperator
from docker.types import Mount
from datetime import datetime

# set dsini yh ...
extract_output_path = '/app/output/yfinance_output.json'
transform_output_path = '/app/output/yfinance_transformed.json'
mongo_coll = 'yfinance_data'

host_output_path = '/home/azureee/project/PahamSaham/output'

default_args = {
    'owner': 'airflow',
    'start_date': datetime(2025, 5, 10),
    'retries': 1
}

with DAG(
    dag_id='yfinance_pipeline_etl',
    default_args=default_args,
    schedule_interval='@daily',
    catchup=False,
    tags=['saham', 'etl'],
) as dag:
    # TASK 1: EXTRACT YFINANCE DATA
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
            'YFINANCE_OUTPUT_PATH': extract_output_path
        },
    )
    
    # TASK 2: TRANSFORM YFINANCE DATA
    transform_yfinance = DockerOperator(
        task_id='transform_yfinance',
        image='transformer:latest',
        auto_remove=True,
        docker_url="unix://var/run/docker.sock",
        network_mode="saham_net",
        mount_tmp_dir=False,
        mounts=[
            Mount(source=host_output_path, target='/app/output', type='bind')
        ],
        command="python yfinance_transform.py",
        container_name="pipeline_transform_yfinance",
        environment={
            'INPUT_PATH': extract_output_path,
            'OUTPUT_PATH': transform_output_path
        },
    )
    
    # TASK 3: LOAD YFINANCE DATA TO MONGODB
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
        command="python yfinance_loader.py",
        container_name="pipeline_load_yfinance",
        environment={
            'MONGO_URI': 'mongodb+srv://big3:daffzidliahafmail@dontsteal.3huq1f6.mongodb.net/',
            'MONGO_DB': 'bigdata_saham',
            'MONGO_COLLECTION': mongo_coll,
            'INPUT_PATH': transform_output_path
        },
    )
    
    # ETL PIPELINE FLOW: Extract -> Transform -> Load
    extract_yfinance >> transform_yfinance >> load_yfinance
